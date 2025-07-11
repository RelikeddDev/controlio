import { configureStore } from '@reduxjs/toolkit';
import themeReducer from './themeSlice';
import cardsReducer from './cardsSlice';
import transactionsReducer from './transactionsSlice';
import categoriesReducer from './categoriesSlice';

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    cards: cardsReducer,
    transactions: transactionsReducer,
    categories: categoriesReducer
  },
});
