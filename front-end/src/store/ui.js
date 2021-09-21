import { createSlice } from "@reduxjs/toolkit";
import store from "store";

export const counterSlice = createSlice({
  name: "ui",
  initialState: {
    positionMap: store.get("ui-position") || {},
    orientation: "landscape",
  },
  reducers: {
    setOrientation(state, action) {
      return {
        ...state,
        orientation: action.payload,
      };
    },
    updatePositionMap: (state, action) => {
      const { orientation } = state;
      const { id, position } = action.payload;
      const old = state.positionMap[id]?.[orientation];
      const newState = {
        ...state,
        positionMap: {
          ...state.positionMap,
          [id]: {
            ...state.positionMap[id],
            [orientation]: {
              ...old,
              ...position,
            },
          },
        },
      };

      store.set("ui-position", newState.positionMap);

      return newState;
    },
  },
});

// Action creators are generated for each case reducer function
export const { updatePositionMap, setOrientation } = counterSlice.actions;

export default counterSlice.reducer;
