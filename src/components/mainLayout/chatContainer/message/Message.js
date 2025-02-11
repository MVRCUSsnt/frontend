import React from "react";
import "./Message.css";

const Message = ({ messageId, content, sender, timestamp, isOwnMessage, onClick }) => {
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString(); // Форматируем дату в удобный вид
    };

    return (
        <div
            className={`message-container ${isOwnMessage ? "own-message" : "other-message"}`}
            onClick={onClick}
        >
            {!isOwnMessage && sender && (
                <div className="message-info">
                    <img
                        src={sender.avatarUrl || "/default-avatar.webp"}
                        alt="Avatar"
                        className="message-avatar"
                    />
                    <span className="message-sender">{sender.name}</span>
                </div>
            )}
            <div className={`message ${isOwnMessage ? "own" : "other"}`}>
                <div className="message-content">{content}</div>
                <div className="message-footer">
                    <span className="message-timestamp">{formatDate(timestamp)}</span>
                </div>
            </div>
        </div>
    );
};

export default Message;
