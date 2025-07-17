import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAppSelector } from "../../../../store/hooks";
import { Box, Typography, Paper, TextField, IconButton } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { jwtDecode } from "jwt-decode";
import { useForm, SubmitHandler } from "react-hook-form";
import { Socket } from "socket.io-client";
import { useTheme } from "../../../../store/hooks";

interface IMessage {
  _id: string;
  sender: string;
  receiver: string;
  content: string;
  createdAt: string;
}

interface DecodedToken {
  id: string;
}

interface IFormInput {
  message: string;
}

export default function UserChatPage({ socket }: { socket: Socket }) {
  const { userID } = useParams<{ userID: string }>();
  const token = useAppSelector((state) => state.auth.accessToken);

  //Розшифровуємо токен, щоб отримати ID поточного користувача, є початок токена - Payload
  // це дані по типу id username і тд, а є кінець де є печатка або Signature,
  //  а бібліотека jwt decode бере з токена дані по типу id не ламаючи печатку в кінці.
  const currentUserId = token ? (jwtDecode(token) as DecodedToken).id : null;

  const { themeStyles } = useTheme();
  const { register, handleSubmit, reset } = useForm<IFormInput>();
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  //   const [newMessage, setNewMessage] = useState(""); //без біліотеки react-hook-form
  // АВТОРИЗАЦІЯ
  useEffect(() => {
    const fetchMessages = async () => {
      if (!userID || !token) return;
      try {
        const response = await fetch(
          `http://localhost:5001/messages/${userID}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!response.ok)
          throw new Error("Не вдалося завантажити повідомлення");
        const data = await response.json();
        setMessages(data);
      } catch (err: any) {
        setError(err.message);
      }
    };
    fetchMessages();
  }, [userID, token]);

  // Цей ефект слухає вхідні повідомлення
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage: IMessage) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]); // стаивить у ...prevMessages попередні message,
      //  які були і плюс показує нові
    };

    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [socket]);
  /// ВІДПРАВКА без react-hook-form
  //   const handleSendMessage = (e: React.FormEvent) => {
  //     e.preventDefault(); /// без перезавантаження
  //     if (!newMessage.trim()) return; /// якшо повідолення пусте то не буде відправки
  //     console.log("Відправляємо:", newMessage);
  //     setNewMessage("");
  //   };

  /// ВІДПРАВКА з react-hook-form
  const handleSendMessage: SubmitHandler<IFormInput> = (data) => {
    if (!data.message.trim() || !socket) return;
    console.log("Відправлено повідомлення:", data.message);

    const messagePayload = {
      content: data.message,
      to: userID,
    };

    socket.emit("private_message", messagePayload);

    reset();
  };

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box
      sx={{
        p: 3,
        display: "flex",
        flexDirection: "column",
        height: "101.5%",
        width: "143%",
        background: themeStyles.background,
        color: themeStyles.textColor,
      }}
    >
      <Typography variant="h4">Чат з користувачем</Typography>
      <Box
        sx={{
          mt: 2,
          p: 2,
          flexGrow: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          background: themeStyles.background,
        }}
      >
        {messages.map((msg) => {
          // Для кожного повідомлення визначаємо, чи є ми його відправником
          const isMyMessage = msg.sender === currentUserId;

          return (
            <Box
              key={msg._id}
              sx={{
                display: "flex",
                justifyContent: isMyMessage ? "flex-end" : "flex-start",
                mb: 1,
              }}
            >
              <Paper
                elevation={2}
                sx={{
                  p: "6px 12px",
                  //Різні кольори для повідомлень
                  backgroundColor: isMyMessage ? "#005c4b" : "#ffffff",
                  color: isMyMessage ? "#ffffff" : "#000000",
                  borderRadius: "12px",
                  maxWidth: "70%",
                }}
              >
                <Typography variant="body1">{msg.content}</Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    textAlign: "right",
                    color: isMyMessage ? "#a2c1bb" : "grey.500",
                    mt: 0.5,
                  }}
                >
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Typography>
              </Paper>
            </Box>
          );
        })}
      </Box>
      {/* Поле вводу нового повідомлення */}
      <Box
        component="form"
        onSubmit={handleSubmit(handleSendMessage)}
        sx={{
          // 👇 Ось тут ми додаємо стилі для рамки
          backgroundColor: themeStyles.paperBg, // Колір фону для самої рамки
          borderRadius: "15px", // Заокруглюємо кути рамки
          mt: 2,
          display: "flex",
          alignItems: "center",
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Напишіть повідомлення..."
          {...register("message", { required: true })}
          sx={{
            p: 2,
            // 👇 Починаємо стилізувати з кореневого елемента інпуту
            "& .MuiOutlinedInput-root": {
              backgroundColor: themeStyles.inputBg, // Задаємо колір фону

              // 👇 Повністю прибираємо рамку
              "& fieldset": {
                border: "none",
              },
              // Прибираємо рамку при наведенні
              "&:hover fieldset": {
                border: "none",
              },
              // Прибираємо рамку при фокусі
              "&.Mui-focused fieldset": {
                border: "none",
              },
            },
            // Стилі для самого тексту, що вводиться
            "& .MuiInputBase-input": {
              color: themeStyles.inputColor,
            },
            // Стилі для плейсхолдера
            "& .MuiInputBase-input::placeholder": {
              color: themeStyles.helperColor,
              opacity: 1,
            },
          }}
        />
        <IconButton type="submit" color="primary" sx={{ ml: 1 }}>
          <SendIcon sx={{pr:2}}/>
        </IconButton>
      </Box>
    </Box>
  );
}
