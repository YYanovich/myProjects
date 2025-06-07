const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true, 
        minlength: 2,
    },
    password: {
        type: String,
        minlength: 4,
        required: true,
    },
    refreshToken: {
        type: String,
        default: "",
    },
});
module.exports = mongoose.model('User', UserSchema)

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

