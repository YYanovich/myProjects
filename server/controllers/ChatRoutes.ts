import express from "express";
import { registerUser, loginUser, refreshAccessToken } from "../services/index.ts";
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
    const users = await User.find({}, "username");
    res.status(200).json(users);
  } catch (error: any) {
    console.error("Помилка під час отримання користувачів:", error);
    res.status(500).json({ message: "Помилка сервера" });
  }
})

export default router;
