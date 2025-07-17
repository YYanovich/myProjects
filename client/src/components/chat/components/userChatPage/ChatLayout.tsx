import React from 'react';
import { Box } from '@mui/material';
import { Socket } from 'socket.io-client';
import AllUsers from '../../components/users/AllUsers';
import UserChatPage from '../userChatPage/UserChatPage';

// Цей компонент відповідає за сторінку приватного чату
export default function PrivateChatView({ socket }: { socket: Socket }) {
  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
      {/* --- ЛІВА КОЛОНКА: Список користувачів в режимі сайдбара --- */}
      <Box
        sx={{
          width: '350px',
          flexShrink: 0,
          borderRight: '1px solid',
          borderColor: 'divider',
        }}
      >
        {/* 👇 Ось тут ми передаємо наш новий пропс */}
        <AllUsers isSidebar={true} />
      </Box>

      {/* --- ПРАВА КОЛОНКА: Сам чат --- */}
      <Box sx={{ flexGrow: 1 }}>
        <UserChatPage socket={socket} />
      </Box>
    </Box>
  );
}