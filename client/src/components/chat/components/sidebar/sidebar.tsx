import React, { useState, useEffect } from "react";
import {
  Typography,
  Box,
  Divider,
  List,
  ListItem,
} from "@mui/material";
import { useTheme } from "../../../../store/hooks";
import { Socket } from "socket.io-client";

// Інтерфейс має відповідати даним з сервера
interface IUser {
  username: string;
  socketID: string;
}

interface SidebarProps {
  socket: Socket;
}

export default function Sidebar({ socket }: SidebarProps) {
  const [users, setUsers] = useState<IUser[]>([]);
  const { themeStyles } = useTheme();

  useEffect(() => {
    // 1. Створюємо єдиний обробник для оновлення списку
    const handleUserListUpdate = (data: IUser[]) => {
      setUsers(data);
    };

    // 2. Слухаємо і подію "responseNewUser" (коли хтось заходить/виходить)
    socket.on("responseNewUser", handleUserListUpdate);
    // І подію "usersList" (відповідь на наш початковий запит)
    socket.on("usersList", handleUserListUpdate);

    // 3. Відправляємо запит на отримання поточного списку, як тільки компонент завантажився
    socket.emit("getUsers");

    // 4. Прибираємо слухачі при розмонтуванні компонента
    return () => {
      socket.off("responseNewUser", handleUserListUpdate);
      socket.off("usersList", handleUserListUpdate);
    };
  }, [socket]);

  return (
    <Box
      sx={{
        height: "100vh",
        bgcolor: themeStyles.paperBg,
        color: themeStyles.textColor,
        p: 2,
        borderRight: "1px solid #333",
        minWidth: 220,
        boxSizing: "border-box",
      }}
    >
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
        Користувачі онлайн
      </Typography>
      <Divider
        sx={{ mb: 2, bgcolor: themeStyles.primaryColor, opacity: 0.3 }}
      />
      <List dense>
        {/* Мапимо напряму зі стану `users`, фільтр більше не потрібен */}
        {users.map((element) => (
          <ListItem
            key={element.socketID}
            sx={{
              px: 1.5,
              py: 0.5,
              borderRadius: 2,
              mb: 0.5,
              bgcolor: themeStyles.inputBg,
              color: themeStyles.textColor,
              fontWeight: 500,
              fontSize: 15,
              textAlign: "center",
              "&:hover": {
                bgcolor: themeStyles.primaryColor,
                color: themeStyles.paperBg,
              },
              cursor: "pointer",
            }}
          >
            {/* Використовуємо `username` замість `user` */}
            {element.username}
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
