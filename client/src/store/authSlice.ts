import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface IAuthState {
  username: string;
  isAuth: boolean;
}

const initialState: IAuthState = {
  username: "",
  isAuth: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login(state, action: PayloadAction<string>) {
      state.username = action.payload;
      state.isAuth = true;
    },
    logout(state) {
      state.username = "";
      state.isAuth = false;
    },
  },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;

