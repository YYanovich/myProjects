import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import http from "http";
import { Server } from "socket.io";
import router from "../controllers/ChatRoutes.ts";
import jwt from "jsonwebtoken";

const ACCESS_SECRET = "access_secret_key";

const app = express();
const PORT = 5001;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Необхідна авторизація"));

  try {
    const decoded = jwt.verify(token, ACCESS_SECRET) as { username: string };
    socket.data.user = decoded;
    next();
  } catch (err) {
    next(new Error("Недійсний токен"));
  }
});

let users: { username: string; socketID: string }[] = [];

io.on("connection", (socket) => {
  const username = socket.data.user?.username;

  if (!username) {
    return socket.disconnect();
  }

  console.log(`${username} (${socket.id}) підключився`);

  users = users.filter((user) => user.username !== username);
  users.push({ username, socketID: socket.id });

  io.emit("responseNewUser", users);

  socket.on("getUsers", () => {
    socket.emit("usersList", users);
  });

  socket.on("message", (data) => {
    if (!data.text) return;
    const message = {
      text: data.text,
      name: username,
      id: `${socket.id}-${Date.now()}`,
      socketID: socket.id,
    };
    io.emit("response", message);
  });

  socket.on("typing", () => {
    socket.broadcast.emit("responseTyping", `${username} is typing`);
  });

  socket.on("disconnect", () => {
    console.log(`${username} (${socket.id}) відключився`);
    users = users.filter((user) => user.socketID !== socket.id);
    io.emit("responseNewUser", users);
  });
});

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(router);

mongoose
  .connect(
    "mongodb+srv://Yanovich:A01020304b@cluster0.pj5zpn6.mongodb.net/ChatDB?retryWrites=true&w=majority&appName=Cluster0"
  )
  .then(() => console.log("Mongo бд підключена"))
  .catch((err) => console.error("Помилка бази даних:", err));

server.listen(PORT, () => {
  console.log(`Server is working on port ${PORT}`);
});

//reg/log/tokens

import bcrypt from "bcrypt";
import User from "../models/User.ts";
type Request = express.Request;
type Response = express.Response;

const REFRESH_SECRET = "refresh_secret_key";

export const registerUser = async (username: string, password: string) => {
  const existing = await User.findOne({ username });
  if (existing) throw new Error("Користувач вже існує");

  const hashedPass = await bcrypt.hash(password, 10);
  const accessToken = jwt.sign({ username }, ACCESS_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ username }, REFRESH_SECRET, {
    expiresIn: "7d",
  });

  const newUser = new User({
    username,
    password: hashedPass,
    refreshToken: {
      token: refreshToken,
      createdAt: new Date(),
    },
  });
  await newUser.save();

  return { accessToken, refreshToken, username };
};

export const loginUser = async (username: string, password: string) => {
  const user = await User.findOne({ username });
  if (!user) throw new Error("Користувача не знайдено");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Невірний пароль");

  const accessToken = jwt.sign({ username }, ACCESS_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ username }, REFRESH_SECRET, {
    expiresIn: "7d",
  });

  user.refreshToken = {
    token: refreshToken,
    createdAt: new Date(),
  };
  await user.save();

  return { accessToken, refreshToken, username };
};

export const register = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  try {
    const result = await registerUser(username, password);
    res.status(201).json({ message: "Реєстрація успішна", ...result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  try {
    const result = await loginUser(username, password);
    res.status(200).json({ message: "Успішний вхід", ...result });
  } catch (err: any) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Login error:", message);

    if (
      message === "Користувача не знайдено" ||
      message === "Невірний пароль"
    ) {
      res.status(401).json({ error: message });
    } else {
      res.status(500).json({ error: "Внутрішня помилка сервера" });
    }
  }
};

export const refreshAccessToken = async (refreshToken: string) => {
  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as {
      username: string;
    };
    const user = await User.findOne({ username: decoded.username });

    if (!user) throw new Error("Користувача не знайдено");

    if (!user.refreshToken || user.refreshToken.token !== refreshToken) {
      throw new Error("Недійсний refresh token");
    }
    const newAccessToken = jwt.sign(
      { username: decoded.username },
      ACCESS_SECRET,
      { expiresIn: "15m" }
    );

    return { accessToken: newAccessToken };
  } catch (error) {
    throw new Error("Недійсний refresh token");
  }
};
