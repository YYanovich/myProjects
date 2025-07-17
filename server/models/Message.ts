import mongoose, { Schema, Document, Types } from "mongoose";

// Цей інтерфейс описує, як виглядає об'єкт повідомлення в коді
export interface IMessage extends Document {
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  content: string;
  createdAt: Date;
}

// Це схема, яка пояснює базі даних, як зберігати повідомлення
const messageSchema: Schema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId, //У цьому полі ми будемо зберігати не все ім'я користувача, 
                                  // а тільки його унікальний ідентифікатор (ID) з бази даних". 
                                  // Це як записати унікальний номер контакту.
      ref: "User", // Посилання на модель User
      required: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: "User", // Посилання на модель User
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // Автоматично додає поля createdAt і updatedAt
  }
);

// Експортуємо готову модель, щоб використовувати її в інших файлах
export default mongoose.model<IMessage>("Message", messageSchema);