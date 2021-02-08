import React, { useRef, useState } from "react";
import "./Joystick.css";

export default function Joystick({ onChange, postion, size, name }) {
  const joytick = useRef(null);
  const rail = useRef(null);
  const [value, setValue] = useState({ x: 0, y: 0 });
  const change = ({ x, y } = { x: 0, y: 0 }) => {
    const railLeft = joytick.current.offsetLeft + rail.current.offsetLeft;
    x = ((x - railLeft) / rail.current.clientWidth) * 2 - 1;
    x = -x;
    const railTop = joytick.current.offsetTop + rail.current.offsetTop;
    y = ((y - railTop) / rail.current.clientHeight) * 2 - 1;
    y = -y;
    if (x > 1) {
      x = 1;
    }
    if (x < -1) {
      x = -1;
    }

    if (y > 1) {
      y = 1;
    }
    if (y < -1) {
      y = -1;
    }
    setValue({ x, y });
    onChange({ x, y });
  };
  return (
    <div
      className="joytick"
      onTouchStart={({ targetTouches: [{ clientX, clientY }] }) => {
        change({ x: clientX, y: clientY });
      }}
      onTouchMove={({ targetTouches: [{ clientX, clientY }] }) => {
        change({ x: clientX, y: clientY });
      }}
      onTouchEnd={() => {
        setValue({ x: 0, y: 0 });
      }}
      ref={joytick}
      style={{
        top: `${postion.y}px`,
        left: `${postion.x}px`,
        transform: `transform: scale(${size});`,
      }}
    >
      <div ref={rail} className="rail"></div>

      <div
        className="handle"
        style={{
          right: `${(value.x + 1) * 50}%`,
          bottom: `${(value.y + 1) * 50}%`,
          transform: `translate(50%, 50%)`,
        }}
      >
        {name}
      </div>
    </div>
  );
}
