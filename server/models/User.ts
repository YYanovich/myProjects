import mongoose, { Document, Schema } from "mongoose";

interface RefreshToken {
  token: string;
  createdAt?: Date;
}

export interface IUser extends Document {
  username: string;
  password: string;
  refreshToken: RefreshToken;
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    refreshToken: {
      token: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    }
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", userSchema);

//🔹 1. const mongoose = require("mongoose");
// require("mongoose") — це підключення бібліотеки Mongoose, яка допомагає працювати з базою даних MongoDB у зручний спосіб.

// 🔹 2. const UserSchema = new mongoose.Schema({ ... });
// Цей рядок створює схему (Schema) — шаблон, який описує, які поля має мати документ у колекції MongoDB (в нашому випадку "користувач").

// Детальніше:
// new mongoose.Schema({...}) — викликаємо клас Schema з mongoose і передаємо йому об'єкт з описом полів.

// 🔹 3. Останній рядок:

// module.exports = mongoose.model("User", UserSchema);
// Цей рядок створює МОДЕЛЬ на основі схеми, яку ми щойно написали.

// Пояснення:
// mongoose.model(...) — створює модель (щось на кшталт "класу" для колекції в базі).

// "User" — назва моделі (і MongoDB автоматично створить колекцію з назвою users — додає s).

// UserSchema — наша схема, яка описує, як виглядає один "user".

// 📦 module.exports = ... — ми експортуємо модель, щоб потім підключати її в інших файлах і писати:
