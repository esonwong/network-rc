import React, { useState } from "react";
import { message, Switch } from "antd";
import { useEventListener, useDebounceEffect, useDebounceFn } from "ahooks";

let curentOrientation;

export default function Orientation({
  serverConfig: { channelList = [] } = {},
  changeChannel,
}) {
  const [enabled, setEnabled] = useState(false);
  const [zeroOrientation, setZeroOrientation] = useState(undefined);
  const [allowed, setAllowed] = useState(false);

  const { run: deviceorientation } = useDebounceFn(
    ({ alpha, beta, gamma }) => {
      !allowed && setAllowed(true);
      curentOrientation = { alpha, beta, gamma };
      if (!zeroOrientation) return;

      channelList.forEach(
        ({ pin, orientation: { coefficient = 1, axis } = {} }) => {
          if (coefficient && axis) {
            // https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Orientation_and_motion_data_explained
            // alpha 0 ~ 360
            // beta -180 ~ 180
            // gamma -90 ~ 90

            let diffrent = curentOrientation[axis] - zeroOrientation[axis];

            if (axis === "alpha") {
              if (Math.abs(diffrent) > Math.abs(360 - diffrent)) {
                diffrent = diffrent - 360;
              }
            }
            const maxDeg = 90;
            diffrent = diffrent < -maxDeg ? -maxDeg : diffrent;
            diffrent = diffrent > maxDeg ? maxDeg : diffrent;
            changeChannel({ pin, value: (diffrent / maxDeg) * coefficient });
          }
        }
      );
    },
    {
      wait: 50,
    }
  );
  useEventListener("deviceorientation", deviceorientation);

  useDebounceEffect(
    () => {
      if (enabled && allowed) {
        setZeroOrientation({ ...curentOrientation });
        message.success("已校准重力");
      }
    },
    [enabled, allowed],
    {
      wait: 100,
    }
  );

  return (
    <Switch
      checked={enabled}
      checkedChildren="重力"
      unCheckedChildren="重力"
      onChange={(enabled) => {
        if (
          enabled === true &&
          !allowed &&
          DeviceMotionEvent &&
          typeof DeviceMotionEvent.requestPermission === "function"
        ) {
          DeviceMotionEvent.requestPermission()
            .then((permissionState) => {
              if (permissionState === "granted") {
                setEnabled(true);
                setAllowed(true);
                message.success("已获得重力感应权限");
              }
            })
            .catch((err) => {
              setEnabled(false);
              message.warn("没有权限", err);
            });
        } else {
          setEnabled(enabled);
        }
      }}
    >
      重力
    </Switch>
  );
}
