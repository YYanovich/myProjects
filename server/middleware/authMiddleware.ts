import express from "express";
import jwt from "jsonwebtoken";

const ACCESS_SECRET = "access_secret_key";

// Розширюємо інтерфейс Request, щоб TypeScript знав про req.user
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; username: string };
    }
  }
}

// 👇 Типізуємо параметри напряму з модуля express
export const protect = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, ACCESS_SECRET);

      // 👇 Додаємо перевірку, що decoded - це об'єкт з потрібними полями
      if (typeof decoded === "object" && "id" in decoded) {
        req.user = { id: decoded.id, username: decoded.username };
        return next(); // Використовуємо return next() для чіткості
      } else {
        throw new Error("Некоректний формат токена");
      }
    } catch (error) {
      res.status(401).json({ message: "Не авторизований, токен невірний" });
      return; // Просто завершуємо функцію
    }
  }

  if (!token) {
    res.status(401).json({ message: "Не авторизований, немає токена" });
    return; // І тут теж
  }
};
