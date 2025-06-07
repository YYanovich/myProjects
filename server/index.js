const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const User = require("./models/User");

const app = express();
const PORT = 5001;

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());

// ===== РЕЄСТРАЦІЯ =====
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    const existing = await User.findOne({ username });
    if (existing)
      return res.status(400).json({ error: "Користувач вже існує" });

    const hashedPass = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPass });

    await newUser.save();

    res.status(201).json({ message: "Реєстрація успішна" });
  } catch (err) {
    res.status(500).json({ error: "Помилка на сервері під час реєстрації" });
  }
});

// ===== АВТОРИЗАЦІЯ =====
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "Користувача не знайдено" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Невірний пароль" });
    }

    res.status(200).json({ message: "Успішний вхід", username: user.username });
  } catch (err) {
    res.status(500).json({ error: "Помилка на сервері під час входу" });
  }
});

mongoose
  .connect("mongodb://localhost:27017/chatDB")
  .then(() => console.log("Mongo бд підключена"))
  .catch((err) => console.error("Помилка бази даних:", err));

const http = require("http").Server(app);
const socketIO = require("socket.io")(http, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const users = [];

socketIO.on("connection", (socket) => {
  console.log(`${socket.id} user connected`);

  socket.on("message", (data) => {
    socketIO.emit("response", data);
  });

  socket.on("typing", (data) => socket.broadcast.emit("responseTyping", data));

  socket.on("newUser", (data) => {
    users.push(data);
    socketIO.emit("responseNewUser", users);
  });

  socket.on("newUserReg", (data) => {
    users.push(data);
    socketIO.emit("responseNewUser", users);
  });

  socket.on("disconnect", () => {
    console.log(`${socket.id} user disconnect`);
    const index = users.findIndex((user) => user.socketID === socket.id);
    if (index !== -1) users.splice(index, 1);
    socketIO.emit("responseNewUser", users);
  });
});

http.listen(PORT, () => {
  console.log(`Server is working on port ${PORT}`);
});
