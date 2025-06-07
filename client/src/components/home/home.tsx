import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./styles.module.css";
import { Socket } from "socket.io-client";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { login, logout } from "../../store/authSlice";

interface IHomeProps {
  socket: Socket;
  isDark: boolean;
}

export default function Home({ socket, isDark }: IHomeProps) {
  const navigate = useNavigate();

  const username = useAppSelector((state) => state.auth.username);
  const isAuth = useAppSelector((state) => state.auth.isAuth);

  const dispatch = useAppDispatch();

  const [formData, setFormData] = useState({
    user: "",
    userPass: "",
    userRegister: "",
    userRegisterPass: "",
  });
  const [error, setError] = useState<string>("");

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = event.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmitLog = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (formData.user.trim() === "") {
      setError("Ім'я не може бути порожнім");
      setTimeout(() => setError(""), 2000);
      return;
    }

    if (formData.userPass.trim() === "") {
      setError("Пароль не може бути порожнім");
      setTimeout(() => setError(""), 2000);
      return;
    }

    try {
      const response = await fetch("http://localhost:5001/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.user,
          password: formData.userPass,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        dispatch(login(data.username));
        socket.emit("newUser", {
          user: formData.user,
          socketID: socket.id,
        });
        navigate("/chat");
      } else {
        setError(data.error || "Помилка входу");
        setTimeout(() => setError(""), 2000);
      }
    } catch (err) {
      setError("Помилка підключення до сервера");
      setTimeout(() => setError(""), 2000);
    }
  };

  const handleSubmitRegister = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (formData.userRegister.trim() === "") {
      setError("Ім'я не може бути порожнім");
      setTimeout(() => setError(""), 2000);
      return;
    }

    if (formData.userRegisterPass.trim() === "") {
      setError("Пароль не може бути порожнім");
      setTimeout(() => setError(""), 2000);
      return;
    }

    try {
      const response = await fetch("http://localhost:5001/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.userRegister,
          password: formData.userRegisterPass,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        socket.emit("newUserReg", {
          userRegister: formData.userRegister,
          socketID: socket.id,
        });
        navigate("/chat");
      } else {
        setError(data.error || "Помилка реєстрації");
        setTimeout(() => setError(""), 2000);
      }
    } catch (err) {
      setError("Помилка підключення до сервера");
      setTimeout(() => setError(""), 2000);
    }
  };

  return (
    <div className={`${styles.home} ${isDark ? styles.dark : styles.light}`}>
      <form onSubmit={handleSubmitLog} className={styles.container}>
        <h2 className={styles.h2}>Вхід у чат</h2>
        <div className={styles.login}>
          <h3>Авторизація</h3>

          <input
            type="text"
            id="user"
            value={formData.user}
            onChange={handleInputChange}
            className={styles.input}
            placeholder=" Введіть своє ім'я"
          />

          <input
            type="password"
            id="userPass"
            value={formData.userPass}
            onChange={handleInputChange}
            className={styles.input}
            placeholder=" Введіть свій пароль"
          />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" className={styles.homeBtn}>
          Вхід
        </button>
      </form>
      {isAuth && <p className={styles.user}>Вітаю, {username}!</p>}

      <form onSubmit={handleSubmitRegister} className={styles.container}>
        <div className={styles.register}>
          <h3>Реєстрація</h3>

          <input
            type="text"
            id="userRegister"
            value={formData.userRegister}
            onChange={handleInputChange}
            className={styles.input}
            placeholder=" Введіть ім'я для реєстрації"
          />

          <input
            type="password"
            id="userRegisterPass"
            value={formData.userRegisterPass}
            onChange={handleInputChange}
            className={styles.input}
            placeholder=" Введіть пароль для реєстрації"
          />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" className={styles.homeBtn}>
          Зареєструватись
        </button>
      </form>
    </div>
  );
}
