import { configureStore } from "@reduxjs/toolkit";
import uiReducer from "./ui.js";

export const store = configureStore({
  reducer: {
    ui: uiReducer,
  },
});
