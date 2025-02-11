import React, { useState, useEffect } from "react";
import "./Sidebar.css";
import Login from "../../authForm/login/Login";
import Registration from "../../authForm/registration/Registration";
import UserProfile from "./userProfile/UserProfile";
import ChatList from "./сhatList/ChatList";

const Sidebar = ({ activeChatId, onSelectChat }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [formType, setFormType] = useState(null);
    const [personalChats, setPersonalChats] = useState([]);
    const [groupChats, setGroupChats] = useState([{ id: 1, name: "Main Room", description: "Основная комната" }]);
    const [isGroupsLoaded, setIsGroupsLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isPersonal, setIsPersonal] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("user")); // Проверка авторизации

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        const storedUserId = localStorage.getItem("userId");

        if (!storedUser || storedUser === "null" || storedUserId === "null") {
            localStorage.removeItem("user");
            localStorage.removeItem("userId");
            localStorage.removeItem("email");
            localStorage.removeItem("avatarUrl");
            setIsProfileOpen(false);
            setIsLoggedIn(false);
        } else {
            fetchGroupChats(); // 🔹 Загружаем чаты при входе
        }
    }, []);

    const fetchGroupChats = () => {
        if (isGroupsLoaded) return;

        setLoading(true);
        fetch("http://localhost:8080/api/rooms/my-rooms?page=0&size=10", {
            method: "GET",
            credentials: "include",
        })
            .then(response => response.json())
            .then(data => {
                // ✅ Удаляем дубликаты
                const uniqueChats = [...new Map(data.map(chat => [chat.id, chat])).values()];

                // ✅ Добавляем "Main Room" только если его нет в списке
                const updatedChats = uniqueChats.some(chat => chat.id === 1)
                    ? uniqueChats
                    : [{ id: 1, name: "Main Room", description: "Основная комната" }, ...uniqueChats];

                setGroupChats(updatedChats);
                setIsGroupsLoaded(true);
            })
            .catch(error => setError(error.message))
            .finally(() => setLoading(false));
    };

    const handleAddGroupChat = () => {
        const groupName = prompt("Введите название новой группы:");
        if (!groupName) return;

        const groupDescription = prompt("Введите описание новой группы:");

        const newRoom = {
            name: groupName,
            description: groupDescription || "Описание отсутствует",
        };

        fetch("http://localhost:8080/api/rooms/create", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newRoom),
        })
            .then(response => response.json())
            .then(createdRoom => {
                setGroupChats(prev => [...prev, createdRoom]); // Добавляем новый чат в список
            })
            .catch(error => alert(`Ошибка: ${error.message}`));
    };

    // 🔹 Логаут: Очистка чатов, удаление данных пользователя, рендер Main Room
    const handleLogout = async () => {
        try {
            await fetch("http://localhost:8080/api/auth/logout", {
                method: "POST",
                credentials: "include",
            });
        } catch (error) {
            console.error("Ошибка при выходе:", error);
        }

        // ❗ Очистка данных
        localStorage.removeItem("user");
        localStorage.removeItem("userId");
        localStorage.removeItem("email");
        localStorage.removeItem("avatarUrl");
        setIsProfileOpen(false);
        setIsLoggedIn(false);

        // ❗ Очищаем список чатов
        setPersonalChats([]);
        setGroupChats([{ id: 1, name: "Main Room", description: "Основная комната" }]);

        // ❗ Обновляем UI
        setIsGroupsLoaded(false);

        // ❗ Автоматически рендерим Main Room (ID 1)
        onSelectChat(1);
    };

    // 🔹 Авторизация (вход)
    const handleLogin = (userData) => {
        localStorage.setItem("user", userData.username);
        localStorage.setItem("userId", userData.id);
        localStorage.setItem("email", userData.email || "");
        localStorage.setItem("avatarUrl", userData.avatarUrl || "/default-avatar.webp");

        setIsLoggedIn(true);
        setIsProfileOpen(false); // ❗ Профиль НЕ открывается автоматически
        setFormType(null); // ❗ Закрываем окно логина
        fetchGroupChats(); // 🔹 Загружаем чаты после входа
    };

    return (
        <>
            <button className="toggle-sidebar" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>☰</button>

            <div className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
                <div className="profile-container" onClick={() => localStorage.getItem("user") ? setIsProfileOpen(!isProfileOpen) : setFormType("login")}>
                    <img src={localStorage.getItem("avatarUrl") || "/default-avatar.webp"} alt="Avatar" className="profile-avatar" />
                    <div className="profile-name">{localStorage.getItem("user") || "Login"}</div>
                </div>

                <ChatList
                    personalChats={personalChats}
                    groupChats={groupChats}
                    activeChatId={activeChatId}
                    onSelectChat={onSelectChat}
                    isPersonal={isPersonal}
                    setIsPersonal={(value) => {
                        setIsPersonal(value);
                        if (!value) fetchGroupChats();
                    }}
                    onAddGroupChat={handleAddGroupChat} // ❗ Кнопка "+" теперь всегда доступна
                />

                {loading && <p>Загрузка...</p>}
                {error && <p className="error">{error}</p>}
            </div>

            {isProfileOpen && localStorage.getItem("user") && (
                <UserProfile
                    onLogout={handleLogout} // Передаем логаут
                    onClose={() => setIsProfileOpen(false)}
                    username={localStorage.getItem("user")}
                />
            )}

            {formType && (
                <div className="auth-overlay">
                    {formType === "login" && <Login onSubmit={handleLogin} onClose={() => setFormType(null)} onSwitch={() => setFormType("register")} />}
                    {formType === "register" && <Registration onSubmit={handleLogin} onClose={() => setFormType(null)} onSwitch={() => setFormType("login")} />}
                </div>
            )}
        </>
    );
};

export default Sidebar;
