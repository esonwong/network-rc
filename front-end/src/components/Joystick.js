import React, { useRef, useState } from "react";
import "./Joystick.scss";
import classnames from "classnames";

const getOffsetLeft = (el) => {
  if (el.offsetParent === null) {
    return 0;
  } else {
    return el.offsetLeft + getOffsetLeft(el.offsetParent);
  }
};

const getOffsetTop = (el) => {
  if (el.offsetParent === null) {
    return 0;
  } else {
    return el.offsetTop + getOffsetTop(el.offsetParent);
  }
};

export default function Joystick({
  onChange,
  name,
  audoReset = true,
  disabled,
  position = { x: 0, y: 0 },
  enabledX = true,
  enabledY = true,
}) {
  const joytick = useRef(null);
  const rail = useRef(null);
  const [value, setValue] = useState({ x: 0, y: 0 });
  const change = ({ x, y } = { x: 0, y: 0 }) => {
    if (enabledX) {
      const railLeft = getOffsetLeft(joytick.current) + position.x;
      x = ((x - railLeft) / rail.current.clientWidth) * 2 - 1;
      x = -x;
      if (x > 1) {
        x = 1;
      }
      if (x < -1) {
        x = -1;
      }
    } else {
      x = 0;
    }

    if (enabledY) {
      const railTop = getOffsetTop(joytick.current) + position.y;
      y = ((y - railTop) / rail.current.clientHeight) * 2 - 1;
      y = -y;

      if (y > 1) {
        y = 1;
      }
      if (y < -1) {
        y = -1;
      }
    } else {
      y = 0;
    }
    setValue({ x, y });
    onChange({ x, y });
  };

  return (
    <div
      className={classnames("joytick", {
        "enabled-x": enabledX,
        "enabled-y": enabledY,
      })}
      onTouchStart={({ targetTouches: [{ clientX, clientY }] }) => {
        if (disabled) return;
        change({ x: clientX, y: clientY });
      }}
      onTouchMove={({ targetTouches: [{ clientX, clientY }] }) => {
        if (disabled) return;
        change({ x: clientX, y: clientY });
      }}
      onTouchEnd={() => {
        if (disabled) return;
        if (!audoReset) return;
        setValue({ x: 0, y: 0 });
        onChange({ x: 0, y: 0 });
      }}
      ref={joytick}
      // style={{
      //   top: `${position.y}px`,
      //   left: `${position.x}px`,
      //   transform: `transform: scale(${size});`,
      // }}
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
