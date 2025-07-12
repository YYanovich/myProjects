import "./App.css";
import { io, Socket } from "socket.io-client";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/home/home";
import ChatPage from "./components/chat/index";
import AllUsers from "./components/chat/components/users/AllUsers";
import UserChatPage from "./components/chat/components/userChatPage/UserChatPage"
import ProtectedRoute from "./ProtectedRoute";
import { useAppSelector } from "./store/hooks";
import { useEffect, useState } from "react";

export default function App() {
  const token = useAppSelector((state) => state.auth.accessToken);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
      }
      setSocket(null);
      return;
    }

    console.log("Створюємо новий сокет з токеном...");
    const newSocket = io("http://localhost:5001", {
      auth: { token },
    });

    setSocket(newSocket);

    return () => {
      console.log("Відключаємо старий сокет...");
      newSocket.disconnect();
    };
  }, [token]);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatPage socket={socket!} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <AllUsers />
          </ProtectedRoute>
        }
      />
      <Route
      path="/chat/:userID"
      element={
        <ProtectedRoute>
          <UserChatPage socket={socket!}/>
        </ProtectedRoute>
      }
      />
    </Routes>
  );
}
