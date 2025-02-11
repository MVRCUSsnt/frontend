import React from "react";
import MainLayout from "./components/mainLayout/MainLayout";
import { AuthProvider } from "./components/authForm/AuthContext"; // Импортируем контекст

function App() {
    return (
        <AuthProvider>
            <MainLayout />
        </AuthProvider>
    );
}

export default App;
