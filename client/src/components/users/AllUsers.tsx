import React, { useState, useEffect } from "react";
import {
  List,
  ListItem,
  ListItemText,
  Typography,
  TextField,
  Box,
} from "@mui/material";
import { useTheme, useAppSelector } from "../../store/hooks";

interface User {
  _id: string;
  username: string;
}

export default function AllUsers() {
  const { themeStyles } = useTheme();
  const token = useAppSelector((state) => state.auth.accessToken);

  const [users, setUsers] = useState<User[]>([]);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("http://localhost:5001/users", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Не вдалося завантажити користувачів");
        }

        const data: User[] = await response.json();
        setUsers(data);
      } catch (error) {
        console.error("Помилка завантаження:", error);
      }
    };

    if (token) {
      fetchUsers();
    }
  }, [token]);

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <Box
      sx={{
        minWidth: "107rem",
        minHeight: "100vh",
        p: 3,
        background: themeStyles.background,
        color: themeStyles.textColor,
        boxSizing: "border-box",
        pl:25
      }}
    >
      <Box
        sx={{
          maxWidth: "500px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          pl: 55
        }}
      >
        <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
         Користувачі
        </Typography>

        <TextField
          label="Пошук користувачів"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
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
          {filteredUsers.map((user) => (
            <ListItem
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
      </Box>
    </Box>
  );
}
