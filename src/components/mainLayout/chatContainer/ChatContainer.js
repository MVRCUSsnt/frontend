import React, { useEffect, useState, useCallback } from "react";
import "./ChatContainer.css";
import Message from "./message/Message";
import WebSocketService from "./WebSocketService";

const ChatContainer = ({ activeChatId, chatInfo, onChangeChat, userId }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [users, setUsers] = useState([]);
    const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [editedMessage, setEditedMessage] = useState("");

    // 🔹 Оптимизированный `fetchMessages`
    const fetchMessages = useCallback(() => {
        if (!activeChatId) return;

        fetch(`http://localhost:8080/api/messages/${activeChatId}`, {
            method: "GET",
            credentials: "include",
        })
            .then(response => response.json())
            .then(data => {
                console.log("📩 Полученные сообщения:", data);
                setMessages(data.map(msg => ({
                    id: msg.messageId, // ✅ Исправлено: ID сообщения
                    roomId: msg.roomId,
                    content: msg.content,
                    timestamp: msg.timestamp,
                    userDTO: msg.userDTO
                })));
            })
            .catch(error => console.error("❌ Ошибка загрузки сообщений:", error));
    }, [activeChatId]);

    // 🔹 Загружаем сообщения при смене чата
    useEffect(() => {
        setMessages([]); // Очищаем сообщения перед загрузкой новых
        fetchMessages();
    }, [fetchMessages]);

    // 🔹 WebSocket подписка на новый чат
    useEffect(() => {
        if (!activeChatId) return;

        WebSocketService.connect(() => {
            WebSocketService.subscribeToChat(activeChatId, (newMessage) => {
                setMessages(prev => [...prev, newMessage]); // ✅ Добавляем новое сообщение в список
            });
        });

        return () => {
            WebSocketService.unsubscribeFromChat(activeChatId);
        };
    }, [activeChatId]);

    // 🔹 Функция отправки сообщения
    const sendMessage = () => {
        if (!newMessage.trim()) return;

        const messageData = {
            content: newMessage,
            roomId: activeChatId,
            timestamp: new Date().toISOString(),
            userDTO: {
                id: userId || parseInt(localStorage.getItem("userId"), 10), // ✅ Теперь id внутри userDTO
            }
        };


        fetch("http://localhost:8080/api/messages/write", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(messageData),
        })
            .then(response => {
                if (!response.ok) throw new Error(`Ошибка: ${response.status}`);
                return response.text();
            })
            .then(data => {
                console.log("📩 Сообщение отправлено:", data);
                setNewMessage("");

                // ❌ НЕ вызываем `fetchMessages()`, т.к. WebSocket уже отправляет обновление
            })
            .catch(error => console.error("❌ Ошибка отправки сообщения:", error));
    };

    // 🔹 Удаление сообщения
    const deleteMessage = (messageId) => {
        if (!messageId) {
            console.error("❌ Ошибка: ID сообщения отсутствует");
            return;
        }

        fetch(`http://localhost:8080/api/messages/delete/${messageId}`, {
            method: "DELETE",
            credentials: "include",
        })
            .then(response => {
                if (!response.ok) throw new Error("Ошибка при удалении сообщения");
                return response.text();
            })
            .then(() => {
                console.log(`🗑️ Сообщение с ID ${messageId} удалено`);
                setSelectedMessage(null);
                fetchMessages();
            })
            .catch(error => console.error("❌ Ошибка удаления сообщения:", error));
    };


    // 🔹 Редактирование сообщения
    const editMessage = () => {
        if (!selectedMessage || !selectedMessage.id) {
            console.error("❌ Ошибка: ID сообщения отсутствует");
            return;
        }

        if (!editedMessage.trim()) return;

        const updatedMessageData = {
            content: editedMessage,
            roomId: activeChatId,
            timestamp: new Date().toISOString(),
            userDTO: {
                id: userId || parseInt(localStorage.getItem("userId"), 10), // ✅ Теперь id внутри userDTO
            }
        };

        fetch(`http://localhost:8080/api/messages/edit/${selectedMessage.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(updatedMessageData),
        })
            .then(response => {
                if (!response.ok) throw new Error("Ошибка при редактировании сообщения");
                return response.json();
            })
            .then(() => {
                setSelectedMessage(null);
                fetchMessages();
            })
            .catch(error => console.error("❌ Ошибка редактирования сообщения:", error));
    };

    // 🔹 Получение участников чата
    const fetchChatUsers = () => {
        fetch(`http://localhost:8080/api/rooms/${activeChatId}/users`, {
            method: "GET",
            credentials: "include",
        })
            .then(response => response.json())
            .then(data => setUsers(data))
            .catch(error => console.error("❌ Ошибка загрузки участников:", error));
    };
    useEffect(() => {
        if (selectedMessage) {
            setEditedMessage(selectedMessage.content); // ✅ Теперь при выборе сообщения текст заполняется
        }
    }, [selectedMessage]);


    // 🔹 Добавление участника
    const handleAddUser = () => {
        const userName = prompt("Введите имя пользователя для добавления:");
        if (!userName) return;

        fetch(`http://localhost:8080/api/rooms/addUser/${activeChatId}/${userName}`, {
            method: "GET",
            credentials: "include",
        })
            .then(response => response.text())
            .then(() => {
                alert(`✅ Пользователь ${userName} успешно добавлен в чат!`);
                fetchChatUsers();
            })
            .catch(error => alert(`❌ Ошибка: ${error.message}`));
    };

    return (

        <div className="chat-container">
            {/* Хедер чата */}
            <div className="chat-header">
                <span className="chat-title">{chatInfo?.name || `Чат ${activeChatId}`}</span>
                <button className="chat-info-btn" onClick={() => setIsModalOpen(true)}>ℹ️</button>
            </div>

            <div className="chat-messages">
                {messages.map((message, index) => (
                    <Message
                        key={message.id || `msg-${index}`}
                        messageId={message.id}
                        content={message.content}
                        sender={{
                            name: message.userDTO?.username || "Anonymous",
                            avatarUrl: message.userDTO?.avatarUrl || "/default-avatar.webp",
                        }}
                        timestamp={message.timestamp}
                        isOwnMessage={message.userId === (userId || parseInt(localStorage.getItem("userId"), 10))}
                        onClick={() => {
                            console.log("🔹 Выбрано сообщение:", message); // ✅ Логируем, что передаем в `setSelectedMessage`
                            setSelectedMessage(message);
                        }}
                    />
                ))}
            </div>


            {/* Поле ввода */}
            <div className="chat-input">
                <input
                    type="text"
                    placeholder="Введите сообщение..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
                <button onClick={sendMessage}>Отправить</button>
            </div>

            {/* Модальное окно редактирования сообщений */}
            {selectedMessage && (
                <div className="message-edit-modal">
                    <div className="message-edit-content">
                        <h3>Редактировать сообщение</h3>
                        <textarea
                            value={editedMessage}
                            onChange={(e) => setEditedMessage(e.target.value)}
                        />

                        <button onClick={() => editMessage(selectedMessage.id)}>Сохранить</button>
                        <button onClick={() => {
                            if (selectedMessage && selectedMessage.id) {
                                deleteMessage(selectedMessage.id);
                            } else {
                                console.error("❌ Ошибка: selectedMessage или его ID отсутствует", selectedMessage);
                            }
                        }}>Удалить
                        </button>
                        <button onClick={() => setSelectedMessage(null)}>Отмена</button>
                    </div>
                </div>
            )}


            {/* Модальное окно с информацией о чате */}
            {isModalOpen && (
                <div className="chat-modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
                        <h2>{chatInfo?.name || `Чат ${activeChatId}`}</h2>
                        <p>{chatInfo?.description || "Описание отсутствует"}</p>
                        <button className="chat-modal-btn" onClick={() => {
                            fetchChatUsers(); // ✅ Добавляем вызов перед открытием окна
                            setIsUsersModalOpen(true);
                        }}>Информация о участниках
                        </button>
                        <button className="chat-modal-btn" onClick={handleAddUser}>Добавить участника</button>
                        <button className="chat-modal-close" onClick={() => setIsModalOpen(false)}>Закрыть</button>
                    </div>
                </div>
            )}
            {/* Модальное окно с участниками */}
            {isUsersModalOpen && (
                <div className="chat-modal-overlay" onClick={() => setIsUsersModalOpen(false)}>
                    <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
                        <h2>Участники чата</h2>
                        {users.length > 0 ? (
                            <ul className="chat-users-list">
                                {users.map(user => (
                                    <li key={user.id} className="chat-user">
                                        <img src={user.avatarUrl || "/default-avatar.webp"} alt="Аватар"
                                             className="user-avatar"/>
                                        <span>{user.username}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : <p>Нет участников</p>}
                        <button className="chat-modal-btn" onClick={fetchChatUsers}>Обновить список</button>
                        <button className="chat-modal-close" onClick={() => setIsUsersModalOpen(false)}>Закрыть</button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ChatContainer;
