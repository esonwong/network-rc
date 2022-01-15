import { createSlice } from "@reduxjs/toolkit";
import store from "store";

export const counterSlice = createSlice({
  name: "ui",
  initialState: {
    volume: 0,
    micVolume: 0,
  },
  reducers: {
    setVolume(state, action) {},
  },
});

// Action creators are generated for each case reducer function
export const { updatePositionMap, setOrientation } = counterSlice.actions;

export default counterSlice.reducer;
