import { createSlice } from "@reduxjs/toolkit";
import store from "store";

export const counterSlice = createSlice({
  name: "setting",
  initialState: {
    host: window.location.host,
    webrtcEnabled: true,
    ...store.get("setting"),
  },
  reducers: {
    saveSetting(state, action) {
      return {
        ...state,
        ...action.payload,
      };
    },
  },
});

// Action creators are generated for each case reducer function
export const { saveSetting } = counterSlice.actions;

export default counterSlice.reducer;
