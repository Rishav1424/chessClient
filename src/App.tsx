import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router";
import { Toaster } from "./components/ui/sonner";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import GamePage from "./pages/Game";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./ProtectedRoute";
import { SocketProvider } from "./pages/SocketProvider";

function App() {
    return (
        <SocketProvider>
            <AppContent />
        </SocketProvider>
    );
}

function AppContent() {
    return (
        <BrowserRouter>
            <Toaster />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/game/:gameId" element={<ProtectedRoute><GamePage/></ProtectedRoute>}/>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
