import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import http from "http";
import { Server } from "socket.io";
import router from "../controllers/ChatRoutes";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/User";
import Message from "../models/Message"; // 👈 1. Імпортуємо вашу модель

// --- Секретні ключі ---
const ACCESS_SECRET = "access_secret_key";
const REFRESH_SECRET = "refresh_secret_key";

// --- Логіка роботи з користувачами та токенами ---
export const registerUser = async (username: string, password: string) => {
  const existing = await User.findOne({ username });
  if (existing) throw new Error("Користувач вже існує");

  const hashedPass = await bcrypt.hash(password, 10);
  const newUser = new User({ username, password: hashedPass });
  await newUser.save();

  const accessToken = jwt.sign({ id: newUser._id, username }, ACCESS_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ id: newUser._id, username }, REFRESH_SECRET, {
    expiresIn: "7d",
  });

  newUser.refreshToken = { token: refreshToken, createdAt: new Date() };
  await newUser.save();

  return { accessToken, refreshToken, username };
};

export const loginUser = async (username: string, password: string) => {
  const user = await User.findOne({ username });
  if (!user) throw new Error("Користувача не знайдено");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Невірний пароль");

  const accessToken = jwt.sign({ id: user._id, username }, ACCESS_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ id: user._id, username }, REFRESH_SECRET, {
    expiresIn: "7d",
  });

  user.refreshToken = { token: refreshToken, createdAt: new Date() };
  await user.save();

  return { accessToken, refreshToken, username };
};

export const refreshAccessToken = async (refreshToken: string) => {
  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);

    //  перевірка типу для decoded
    if (typeof decoded !== "object" || !("id" in decoded)) {
      throw new Error("Некоректний формат токена");
    }

    const user = await User.findOne({ _id: decoded.id }); // шукаємо по _id, так надійніше

    if (!user) throw new Error("Користувача не знайдено");

    if (!user.refreshToken || user.refreshToken.token !== refreshToken) {
      throw new Error("Недійсний refresh token");
    }

    // Кладемо в новий токен і id, і username
    const newAccessToken = jwt.sign(
      { id: user._id, username: user.username },
      ACCESS_SECRET,
      { expiresIn: "15m" }
    );

    return { accessToken: newAccessToken };
  } catch (error) {
    // Перекидаємо помилку далі, щоб її можна було зловити в ChatRoutes
    throw new Error("Недійсний або прострочений refresh token");
  }
};

// --- Налаштування сервера ---
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
    const decoded = jwt.verify(token, ACCESS_SECRET);

    // І тут додаємо таку ж перевірку
    if (typeof decoded === "object" && "username" in decoded) {
      socket.data.user = decoded;
      next();
    } else {
      next(new Error("Некоректний формат токена"));
    }
  } catch (err) {
    next(new Error("Недійсний токен"));
  }
});

// 👇 КРОК 1: Оновлюємо тип масиву, додаємо поле 'id'
let users: { id: string; username: string; socketID: string }[] = [];

io.on("connection", (socket) => {
  // 👇 КРОК 2: Дістаємо і ID, і username з даних сокета
  const userId = socket.data.user?.id;
  const username = socket.data.user?.username;

  // Перевіряємо, чи є обидва поля
  if (!userId || !username) {
    return socket.disconnect();
  }

  console.log(`${username} (${socket.id}) підключився`);

  // Прибираємо старий запис цього користувача (якщо він перезаходить)
  users = users.filter((user) => user.id !== userId);
  // Додаємо новий запис з усіма трьома полями
  users.push({ id: userId, username, socketID: socket.id });

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

  // ЗАМІНІТЬ ВАШ ПОТОЧНИЙ ОБРОБНИК НА ЦЕЙ:
  socket.on("private_message", async (messagePayload) => {
    try {
      // 2. Отримуємо дані з "посилки" від клієнта
      const { content, to: receiverId } = messagePayload;
      const senderId = socket.data.user.id;

      // 3. Перевіряємо, чи є всі дані
      if (!content || !receiverId) {
        console.error("Помилка: відсутній текст або одержувач.");
        return;
      }

      // 4. Створюємо і зберігаємо повідомлення в базі даних
      const newMessage = new Message({
        sender: senderId,
        receiver: receiverId,
        content: content,
      });
      const savedMessage = await newMessage.save();

      // 5. Знаходимо сокет одержувача, щоб відправити йому повідомлення
      const receiverSocket = users.find((user) => user.id === receiverId);

      // 6. Відправляємо збережене повідомлення (з _id і createdAt) назад собі
      io.to(socket.id).emit("new_message", savedMessage);

      // 7. Якщо одержувач онлайн, відправляємо повідомлення і йому
      if (receiverSocket) {
        io.to(receiverSocket.socketID).emit("new_message", savedMessage);
      }
    } catch (error) {
      console.error("Помилка при обробці приватного повідомлення:", error);
    }
  });

  socket.on("typing", () => {
    socket.broadcast.emit("responseTyping", `${username} is typing`);
  });

  socket.on("disconnect", () => {
    // 👇 Беремо дані з сокета, що відключається
    const disconnectedUser = socket.data.user;

    // Перевіряємо, чи були дані про користувача
    if (disconnectedUser) {
      console.log(`${disconnectedUser.username} (${socket.id}) відключився`);
      // Фільтруємо по унікальному ID користувача, а не по socketID, це надійніше
      users = users.filter((user) => user.id !== disconnectedUser.id);
      io.emit("responseNewUser", users);
    } else {
      console.log(`Невідомий користувач (${socket.id}) відключився`);
    }
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
