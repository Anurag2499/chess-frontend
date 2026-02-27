import { createSlice } from '@reduxjs/toolkit';

const gameSlice = createSlice({
  name: 'game',
  initialState: null,
  reducers: {
    gameMode: (state, action) => {
      return action.payload;
    },
  },
});

export const { gameMode } = gameSlice.actions;
export default gameSlice.reducer;
