import React, { useState } from "react";
import { message, Switch } from "antd";

let curentOrientation,
  isSupportedOrientaion = false;

const deviceorientation = (e) => {
  const { alpha, beta, gamma } = e;
  curentOrientation = { alpha, beta, gamma };
  if (alpha && !isSupportedOrientaion) {
    isSupportedOrientaion = true;
    message.info("手机横屏点击修正进行校准可开启,重力感应控制方向╰(*°▽°*)╯！");
  }
};

export default function Orientation() {
  const [enabled, setEnabled] = useState(false);

  return (
    <Switch
      checked={enabled}
      onChange={(enabled) => {
        if (
          enabled === true &&
          typeof DeviceMotionEvent.requestPermission === "function"
        ) {
          DeviceMotionEvent.requestPermission()
            .then((permissionState) => {
              if (permissionState === "granted") {
                setEnabled(enabled);
                window.addEventListener(
                  "deviceorientation",
                  deviceorientation,
                  false
                );
              }
            })

            .catch((err) => {
              setEnabled(false);
              message.warn("用户未允许权限", err);
            });
        } else {
          setEnabled(enabled);
        }
        if (!enabled) {
          window.removeEventListener("deviceorientation", deviceorientation);
        }
      }}
    >
      重力
    </Switch>
  );
}
