import React, { useState } from "react";
import { message, Switch } from "antd";
import { useEventListener, useDebounceEffect } from "ahooks";

let curentOrientation;

export default function Orientation({
  serverConfig: { channelList = [] } = {},
  changeChannel,
}) {
  const [enabled, setEnabled] = useState(false);
  const [zeroOrientation, setZeroOrientation] = useState(undefined);
  const [allowed, setAllowed] = useState(false);

  const deviceorientation = ({ alpha, beta, gamma }) => {
    !allowed && setAllowed(true);
    curentOrientation = { alpha, beta, gamma };
    // const directionChannel = channelList.find(
    //   ({ id }) => id === specialChannel.direction
    // );
    // if (!directionChannel) return;
    if (!zeroOrientation) return;

    channelList.forEach(
      ({ pin, orientation: { coefficient = 1, axis } = {} }) => {
        if (coefficient && axis) {
          let diffrent = curentOrientation[axis] - zeroOrientation[axis];
          diffrent = diffrent < -30 ? -30 : diffrent;
          diffrent = diffrent > 30 ? 30 : diffrent;
          changeChannel({ pin, value: (diffrent / 30) * coefficient });
        }
      }
    );
  };

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
