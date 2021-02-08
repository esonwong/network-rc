import React from "react";
import Joystick from "./Joystick";

export default function ControlUI({
  uiComponentList = [],
  channelList,
  changeChannel = function () {},
}) {
  const onControl = (id, v) => {
    channelList.forEach(({ enabled, ui, pin }) => {
      if (!enabled) return;
      ui.forEach(({ id: cId, positive, axis }) => {
        if (id === cId) {
          changeChannel({ pin, value: positive ? v[axis] : -v[axis] });
        }
      });
    });
  };

  return (
    <div className="control-ui">
      {uiComponentList.map(({ id, name, enabled, type, size, postion }) =>
        enabled ? (
          type === "joystick" ? (
            <Joystick
              name={name}
              postion={postion}
              onChange={(v) => onControl(id, v)}
              size={size}
            />
          ) : undefined
        ) : undefined
      )}
    </div>
  );
}
