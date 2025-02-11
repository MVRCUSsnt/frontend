import React, { useState } from "react";
import Sidebar from "./sidebar/Sidebar";
import ChatContainer from "./chatContainer/ChatContainer";
import "./MainLayout.css"; // CSS для макета

const MainLayout = () => {
    const [activeChatId, setActiveChatId] = useState(1); // Храним ID активного чата

    return (
        <div className="main-layout">
            <Sidebar activeChatId={activeChatId} onSelectChat={setActiveChatId} />
            <ChatContainer activeChatId={activeChatId} onChangeChat={setActiveChatId} />
        </div>
    );
};

export default MainLayout;
