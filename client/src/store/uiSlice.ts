import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface IUIState {
  isDark: boolean;
}

const initialState: IUIState = {
  isDark: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleTheme(state) {
      state.isDark = !state.isDark;
    },
    setTheme(state, action: PayloadAction<boolean>) {
      state.isDark = action.payload;
    },
  },
});

export const { toggleTheme, setTheme } = uiSlice.actions;
export default uiSlice.reducer;
