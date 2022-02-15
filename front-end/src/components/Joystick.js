import React, { useRef, useState } from "react";
import "./Joystick.scss";
import classnames from "classnames";
import { useMemo } from "react";
import throttle from "lodash.throttle";

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
  autoReset,
  disabled,
  position = { x: 0, y: 0 },
  enabledX = true,
  enabledY = true,
}) {
  const joytick = useRef(null);
  const rail = useRef(null);
  const [value, setValue] = useState({ x: 0, y: 0 });
  const [mouseStarting, setMouseStarting] = useState(false);
  const [tochTime, setTochTime] = useState();
  const [mode, setMode] = useState(undefined);
  const _onChange = useMemo(
    () =>
      throttle(
        (...args) => {
          console.log("onChange", ...args);
          onChange(...args);
        },
        50,
        { leading: false, trailing: true }
      ),
    [onChange]
  );
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
    _onChange({ x, y });
  };

  const start = ({ x, y }) => {
    if (disabled) return;
    const now = new Date().getTime();
    if (Math.abs(now - tochTime) < 200) {
      setValue({ x: 0, y: 0 });
      _onChange({ x: 0, y: 0 });
      return;
    }
    setTochTime(now);
    change({ x, y });
  };

  const move = ({ x, y }) => {
    if (disabled) return;
    console.log("move");
    change({ x, y });
  };

  const end = () => {
    if (disabled) return;
    if (!autoReset) return;
    console.log("end");
    setValue({ x: 0, y: 0 });
    _onChange({ x: 0, y: 0 });
  };

  return (
    <div
      className={classnames("joytick", {
        "enabled-x": enabledX,
        "enabled-y": enabledY,
      })}
      onTouchStart={({ targetTouches: [{ clientX: x, clientY: y }] }) => {
        !mode && setMode("touch");
        if (mode === "mouse") return;
        start({ x, y });
      }}
      onTouchMove={({ targetTouches: [{ clientX: x, clientY: y }] }) => {
        if (mode === "mouse") return;
        move({ x, y });
      }}
      onTouchEnd={() => {
        if (mode === "mouse") return;
        end();
      }}
      ref={joytick}
      onMouseDown={({ clientX: x, clientY: y }) => {
        !mode && setMode("mouse");
        if (mode === "touch") return;
        setMouseStarting(true);
        start({ x, y });
      }}
      onMouseMove={({ clientX: x, clientY: y }) => {
        if (mode === "touch") return;
        if (!mouseStarting) return;
        move({ x, y });
      }}
      onMouseUp={() => {
        if (mode === "touch") return;
        setMouseStarting(false);
        end();
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
