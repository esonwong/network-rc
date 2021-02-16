import React from "react";
import Joystick from "./Joystick";

export default function JoystickSlider({ onChange, vertical, ...other }) {
  return (
    <Joystick
      onChange={({ x, y }) => {
        onChange(vertical ? y : x);
      }}
      enabledX={!vertical}
      enabledY={vertical}
      {...other}
    />
  );
}
