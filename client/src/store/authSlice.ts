import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface IAuthState {
  username: string;
  isAuth: boolean;
  accessToken: string;
}

// Спробуємо ініціалізувати стан з localStorage
const initialState: IAuthState = {
  username: "", // Ми не можемо надійно зберігати username, його треба брати з токена
  isAuth: !!localStorage.getItem("token"),
  accessToken: localStorage.getItem("token") || "",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login(
      state,
      action: PayloadAction<{ username: string; accessToken: string }>
    ) {
      state.username = action.payload.username;
      state.accessToken = action.payload.accessToken;
      state.isAuth = true;
      // Зберігаємо токен, щоб сесія не зникала при перезавантаженні
      localStorage.setItem("token", action.payload.accessToken);
    },
    logout(state) {
      state.username = "";
      state.accessToken = "";
      state.isAuth = false;
      // ЦЕ НАЙВАЖЛИВІШИЙ РЯДОК!
      localStorage.removeItem("token");
    },
  },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;
