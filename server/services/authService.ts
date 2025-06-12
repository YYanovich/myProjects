import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import express from "express";
type Request = express.Request;
type Response = express.Response;

const ACCESS_SECRET = "access_secret_key";
const REFRESH_SECRET = "refresh_secret_key";

export const registerUser = async (username: string, password: string) => {
  const existing = await User.findOne({ username });
  if (existing) throw new Error("Користувач вже існує");

  const hashedPass = await bcrypt.hash(password, 10);
  const accessToken = jwt.sign({ username }, ACCESS_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign({ username }, REFRESH_SECRET, { expiresIn: "7d" });

  const newUser = new User({ 
    username, 
    password: hashedPass,
    refreshTokens: [{ token: refreshToken }]
  });
  await newUser.save();

  return { accessToken, refreshToken, username };
};

export const loginUser = async (username: string, password: string) => {
  const user = await User.findOne({ username });
  if (!user) throw new Error("Користувача не знайдено");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Невірний пароль");

  const accessToken = jwt.sign({ username }, ACCESS_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign({ username }, REFRESH_SECRET, { expiresIn: "7d" });

  user.refreshTokens.push({ token: refreshToken });
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
    res.status(401).json({ error: err.message });
  }
};

export const refreshAccessToken = async (refreshToken: string) => {
  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as { username: string };
    const user = await User.findOne({ username: decoded.username });
    
    if (!user) throw new Error("Користувача не знайдено");
    
    const tokenExists = user.refreshTokens.some((t: any) => t.token === refreshToken);
    if (!tokenExists) throw new Error("Недійсний refresh token");
    
    const newAccessToken = jwt.sign({ username: decoded.username }, ACCESS_SECRET, { expiresIn: "15m" });
    
    return { accessToken: newAccessToken };
  } catch (error) {
    throw new Error("Недійсний refresh token");
  }
};

