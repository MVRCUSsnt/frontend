import SockJS from "sockjs-client";
import {Client} from "@stomp/stompjs";

const SOCKET_URL = "http://localhost:8080/ws";

class WebSocketService {
    constructor() {
        this.client = null;
        this.subscriptions = {};
        this.isConnected = false; // ✅ Флаг подключения
        this.pendingSubscriptions = []; // ✅ Очередь подписок, которые ждут подключения
    }

    connect(onConnectCallback, onErrorCallback) {
        if (this.client && this.isConnected) {
            console.log("✅ WebSocket уже подключен");
            if (onConnectCallback) onConnectCallback();
            return;
        }

        console.log("🔄 Opening Web Socket...");
        const socket = new SockJS(SOCKET_URL);
        this.client = new Client({
            webSocketFactory: () => socket,
            reconnectDelay: 5000, // ✅ Авто-переподключение
            debug: (str) => console.log(str),
            onConnect: () => {
                console.log("✅ WebSocket подключен");
                this.isConnected = true;

                // ✅ Выполняем все подписки, которые ждали подключения
                this.pendingSubscriptions.forEach(({ chatId, callback }) => {
                    this.subscribeToChat(chatId, callback);
                });
                this.pendingSubscriptions = []; // Очищаем очередь

                if (onConnectCallback) onConnectCallback();
            },
            onDisconnect: () => {
                console.warn("❌ WebSocket отключен");
                this.isConnected = false;
            },
            onStompError: (frame) => {
                console.error("❌ Ошибка STOMP:", frame);
                this.isConnected = false;
                if (onErrorCallback) onErrorCallback(frame);
            }
        });

        this.client.activate(); // ✅ Запускаем WebSocket
    }

    subscribeToChat(chatId, onMessageReceived) {
        if (!this.client || !this.isConnected) {
            console.warn(`⚠️ WebSocket ещё не подключен, подписка отложена: ${chatId}`);
            this.pendingSubscriptions.push({ chatId, callback: onMessageReceived }); // ✅ Откладываем подписку
            return;
        }

        if (this.subscriptions[chatId]) {
            console.warn(`⚠️ Уже подписаны на ${chatId}`);
            return;
        }

        this.subscriptions[chatId] = this.client.subscribe(`/topic/messages/${chatId}`, (message) => {
            const newMessage = JSON.parse(message.body);
            console.log("📨 Новое сообщение:", newMessage);
            onMessageReceived(newMessage);
        });
        console.log(`🔔 Подписка на чат ${chatId}`);
    }

    unsubscribeFromChat(chatId) {
        if (this.subscriptions[chatId]) {
            this.subscriptions[chatId].unsubscribe();
            delete this.subscriptions[chatId];
            console.log(`🔕 Отписка от чата ${chatId}`);
        }
    }

    disconnect() {
        if (this.client) {
            Object.keys(this.subscriptions).forEach(chatId => {
                this.unsubscribeFromChat(chatId);
            });

            this.client.deactivate();
            this.isConnected = false;
            console.log("🔌 WebSocket отключен");
        }
    }
}

export default new WebSocketService();
