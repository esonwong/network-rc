import React, { useRef } from "react";

export default function Slider({
  className,
  vertical = false,
  value,
  onChange,
}) {
  const silder = useRef(null);
  const rail = useRef(null);
  // const [startPostion, setStartPostion] = useState("startPostion");
  const change = (x, y) => {
    if (!x) {
      onChange(0);
      return;
    }
    let v;
    if (vertical === false) {
      const railLeft = silder.current.offsetLeft + rail.current.offsetLeft;
      v = ((x - railLeft) / rail.current.clientWidth) * 2 - 1;
      v = -v;
    } else {
      const railTop = silder.current.offsetTop + rail.current.offsetTop;
      v = ((y - railTop) / rail.current.clientHeight) * 2 - 1;
      v = -v;
    }
    if (v > 1) {
      v = 1;
    }
    if (v < -1) {
      v = -1;
    }
    onChange(v);
  };
  return (
    <div
      className={`ant-slider ${className} ${
        vertical === false ? "" : "ant-slider-vertical"
      }`}
      onTouchStart={({ targetTouches: [{ clientX, clientY }] }) => {
        // setStartPostion({ clientX, clientY });
        change(clientX, clientY);
      }}
      onTouchMove={({ targetTouches: [{ clientX, clientY }] }) => {
        change(clientX, clientY);
      }}
      onTouchEnd={() => {
        change();
      }}
      ref={silder}
    >
      <div ref={rail} class="ant-slider-rail"></div>
      <div
        tabindex="0"
        className="ant-slider-handle"
        style={{
          [`${vertical === false ? "right" : "bottom"}`]: `${(value + 1) * 50}%`,
          [`${vertical === false ? "left" : "top"}`]: "auto",
          transform: `translate${vertical === false ? "X(" : "Y("}50%)`,
        }}
      ></div>
    </div>
  );
}
