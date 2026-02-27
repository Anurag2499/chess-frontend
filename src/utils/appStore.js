import { configureStore } from '@reduxjs/toolkit';
import gameReducer from './gameSlice';

const appStore = configureStore({
  reducer: {
    game: gameReducer,
  },
});

export default appStore;
