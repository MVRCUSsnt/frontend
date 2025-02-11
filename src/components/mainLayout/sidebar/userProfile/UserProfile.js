import React, { useState, useEffect } from "react";
import "./UserProfile.css";
import WebSocketService from "../../chatContainer/WebSocketService";

const UserProfile = ({ onLogout, onClose }) => {
    const [user, setUser] = useState({
        username: localStorage.getItem("user") || "Guest",
        avatarUrl: localStorage.getItem("avatarUrl") || "/default-avatar.webp",
        email: localStorage.getItem("email") || "No email available"
    });

    useEffect(() => {
        const handleStorageChange = () => {
            setUser({
                username: localStorage.getItem("user") || "Guest",
                avatarUrl: localStorage.getItem("avatarUrl") || "/default-avatar.webp",
                email: localStorage.getItem("email") || "No email available"
            });
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    const handleLogout = async () => {
        try {
            await fetch("http://localhost:8080/api/auth/logout", { method: "POST", credentials: "include" });
        } catch (error) {
            console.error("Ошибка при выходе:", error);
        }
        WebSocketService.disconnect();
        localStorage.removeItem("user");
        localStorage.removeItem("userId");
        localStorage.removeItem("avatarUrl");
        localStorage.removeItem("email");
        setUser({ username: "Guest", avatarUrl: "/default-avatar.webp", email: "No email available" });
        onLogout();
    };

    return (
        <div className="user-profile">
            <button className="close-btn" onClick={onClose}>✖</button>
            <div className="profile-header">
                <img src={user.avatarUrl} alt="User Avatar" className="profile-avatar" />
                <h2>{user.username}</h2>
                <p>{user.email}</p>
            </div>
            <div className="profile-actions">
                <button className="profile-btn">Настройки</button>
                <button className="logout-btn" onClick={handleLogout}>Выход</button>
            </div>
        </div>
    );
};

export default UserProfile;
