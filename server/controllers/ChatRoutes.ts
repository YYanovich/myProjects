import express from "express";
import {
  registerUser,
  loginUser,
  refreshAccessToken,
} from "../services/index.ts";
import User from "../models/User.ts";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await registerUser(username, password);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await loginUser(username, password);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const result = await refreshAccessToken(refreshToken);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(401).json({ message: error.message });
  }
});

router.get("/users", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    // 1. Отримуємо пошуковий запит з URL
    const searchQuery = (req.query.search as string) || "";

    // 2. Створюємо об'єкт фільтра для бази даних
    const filter = {
      // Ми шукаємо по полю username
      // $regex - це команда MongoDB для пошуку по регулярному виразу (частковому збігу)
      // $options: 'i' - робить пошук нечутливим до регістру (Іван = іван)
      username: { $regex: searchQuery, $options: "i" },
    };

    // 3. Використовуємо цей фільтр в обох запитах
    const [users, totalUsers] = await Promise.all([
      User.find(filter, "username _id").skip(offset).limit(limit),
      User.countDocuments(filter), // Рахуємо тільки відфільтрованих користувачів
    ]);

    res.status(200).json({
      users,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
    });
  } catch (error: any) {
    console.error("Помилка під час отримання користувачів:", error);
    res.status(500).json({ message: "Помилка сервера" });
  }
});

// router.get("/messages/:otherUserId", async (req, res) => {
//   try{
//     const firstUser = req.user.id as string
//     const secondUser = req.params.otherUserId as string
//   }
//   catch (error: any) {
//     console.error("Помилка у приватних чатах: ", error)
//   }
// })

export default router;
