import React, { useState, useEffect } from "react";
import {
  List,
  ListItem,
  ListItemText,
  Typography,
  TextField,
  Box,
  Pagination,
} from "@mui/material";
import { useTheme, useAppSelector } from "../../../../store/hooks";
import { useNavigate } from "react-router-dom";
interface User {
  _id: string;
  username: string;
}

export default function AllUsers() {
  const { themeStyles } = useTheme();
  const token = useAppSelector((state) => state.auth.accessToken);

  const [users, setUsers] = useState<User[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [debouncedInputValue, setDebouncedInputValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(
          `http://localhost:5001/users?page=${currentPage}&limit=10&search=${debouncedInputValue}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Не вдалося завантажити користувачів");
        }

        const data = await response.json();
        setUsers(Array.isArray(data.users) ? data.users : []);
        setTotalPages(data.totalPages || 0);
      } catch (error) {
        console.error("Помилка завантаження:", error);
        setUsers([]);
      }
    };

    if (token) {
      fetchUsers();
    }
  }, [token, currentPage, debouncedInputValue]);

  useEffect(() => {
    const debouncedTimer = setTimeout(() => {
      setDebouncedInputValue(inputValue);
      setCurrentPage(1);
    }, 500);

    return () => {
      clearTimeout(debouncedTimer);
    };
  }, [inputValue]);

  const navigate = useNavigate();

  const handleUserClick = (userID: string, username: string) => {
    console.log(`Обрано користувача ${username} з ID ${userID}`);
    navigate(`/chat/${userID}`);
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setCurrentPage(value);
  };

  return (
    <Box
      sx={{
        minWidth: "107rem",
        minHeight: "100vh",
        p: 3,
        background: themeStyles.background,
        color: themeStyles.textColor,
        boxSizing: "border-box",
        pl: 25,
      }}
    >
      <Box
        sx={{
          maxWidth: "500px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          pl: 55,
        }}
      >
        <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
          Користувачі
        </Typography>

        <TextField
          label="Пошук користувачів"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          fullWidth
          variant="outlined"
          sx={{
            "& .MuiOutlinedInput-root": {
              backgroundColor: themeStyles.paperBg,
              "& fieldset": {
                borderColor: themeStyles.inputBg,
              },
              "&:hover fieldset": {
                borderColor: themeStyles.primaryColor,
              },
              "&.Mui-focused fieldset": {
                borderColor: themeStyles.primaryColor,
              },
            },
            "& .MuiInputLabel-root": {
              color: themeStyles.textColor,
            },
            "& .MuiInputLabel-root.Mui-focused": {
              color: themeStyles.primaryColor,
            },
            input: { color: themeStyles.textColor },
          }}
        />

        <List sx={{ width: "100%" }}>
          {users.map((user) => (
            <ListItem
              onClick={() => handleUserClick(user._id, user.username)}
              key={user._id}
              sx={{
                bgcolor: themeStyles.paperBg,
                border: `1px solid ${themeStyles.inputBg}`,
                borderRadius: "8px",
                mb: 1,
                cursor: "pointer",
                "&:hover": {
                  bgcolor: themeStyles.primaryColor,
                  color: themeStyles.paperBg,
                  borderColor: themeStyles.primaryColor,
                },
              }}
            >
              <ListItemText primary={user.username} />
            </ListItem>
          ))}
        </List>
        <Pagination
          count={totalPages}
          page={currentPage}
          onChange={handlePageChange}
        ></Pagination>
      </Box>
    </Box>
  );
}
