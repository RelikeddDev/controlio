// src/store/themeSlice.js
import { createSlice } from '@reduxjs/toolkit';

const storedTheme = localStorage.getItem('darkMode');
const initialState = {
  darkMode: storedTheme ? JSON.parse(storedTheme) : false,
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setDarkMode: (state, action) => {
      state.darkMode = action.payload;
      localStorage.setItem('darkMode', JSON.stringify(action.payload)); // guarda en localStorage
    },
  },
});

export const { setDarkMode } = themeSlice.actions;
export default themeSlice.reducer;
