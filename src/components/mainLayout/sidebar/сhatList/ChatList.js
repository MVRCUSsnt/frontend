import React from "react";
import "./ChatList.css";

const ChatList = ({ personalChats = [], groupChats = [], activeChatId, onSelectChat, isPersonal, setIsPersonal, onAddGroupChat }) => {
    console.log("📌 Переключение вкладок:");
    console.log("🔹 Личные сообщения?", isPersonal);
    console.log("🔹 Список личных чатов:", personalChats);
    console.log("🔹 Список групповых чатов:", groupChats);

    return (
        <div className="chat-list-container">
            <div className="chat-toggle-buttons">
                <button className={isPersonal ? "active" : ""} onClick={() => setIsPersonal(true)}>
                    Личные сообщения
                </button>
                <button className={!isPersonal ? "active" : ""} onClick={() => setIsPersonal(false)}>
                    Группы
                </button>
            </div>

            <div className="group-section">
                <ul className="chat-list">
                    {(isPersonal ? personalChats : groupChats).map((chat) => {
                        console.log(`📝 Отображение чата: ID ${chat.id}, Название: ${chat.name}`);
                        return (
                            <li
                                key={chat.id}
                                className={chat.id === activeChatId ? "active" : ""}
                                onClick={() => {
                                    console.log(`📌 Выбран чат: ${chat.id}`);
                                    onSelectChat(chat.id);
                                }}
                            >
                                <div className="chat-item">
                                    <span className="chat-name">{chat.name}</span>
                                </div>
                            </li>
                        );
                    })}
                </ul>

                {!isPersonal && (
                    <button className="add-group-chat" onClick={onAddGroupChat}>+</button>
                )}
            </div>
        </div>
    );
};

export default ChatList;
