import React, { useState } from "react";
import Joystick from "./Joystick";
import Camera from "./Camera";
import { Rnd } from "react-rnd";
import store from "store";
import { useEventListener, useUpdateEffect } from "ahooks";
import "./ControlUI.scss";
import classnames from "classnames";
import JoystickSlider from "./JoystickSlider";

const screenDirction = window.matchMedia("(orientation: portrait)");
export default function ControlUI({
  uiComponentList = [],
  channelList,
  changeChannel = function () {},
  editabled,
  cameraList,
  setting,
  isShowButton,
  channelStatus,
  session,
  webrtcChannel,
}) {
  const [orientation, setOrientation] = useState(
    screenDirction.matches ? "portrait" : "landscape"
  );

  const [positionMap, setPositionMap] = useState(
    store.get("ui-position") || {}
  );

  const savePosition = (id, position) => {
    if (!positionMap[id]) {
      positionMap[id] = {};
    }
    positionMap[id][orientation] = { ...position };
    setPositionMap({ ...positionMap });
  };

  useUpdateEffect(() => {
    if (!editabled) {
      store.set("ui-position", positionMap);
    }
  }, [editabled]);

  useEventListener(
    "change",
    ({ matches }) => {
      setOrientation(matches ? "portrait" : "landscape");
    },
    {
      target: screenDirction,
    }
  );

  const onControl = (id, v) => {
    channelList.forEach(({ enabled, ui = [], pin }) => {
      if (!enabled) return;
      ui.forEach(({ id: cId, positive, axis }) => {
        if (id === cId) {
          changeChannel({
            pin,
            value: (positive ? 1 : -1) * (axis ? v[axis] : v),
          });
        }
      });
    });
  };

  const list = [
    ...cameraList.map((i) => {
      i.id = `camera-${i.cameraIndex}`;
      i.type = "camera";
      i.cameraIndex = i.index;
      i.enabled = true;
      return i;
    }),
    ...(isShowButton ? uiComponentList : []),
  ];

  return (
    <>
      {list.map(
        (
          {
            id,
            name,
            enabled,
            type,
            autoReset,
            cameraIndex,
            vertical,
            defaultPosition,
          },
          index
        ) => {
          let position = positionMap[id]?.[orientation] ||
            defaultPosition?.[orientation] || {
              x: index * 70,
              y: index * 30,
              z: positionMap[id]?.[orientation]?.z || index + 2,
              size: undefined,
              ratio: undefined,
            };

          const { size, z, x, y, ratio, videoRate = 4 / 3 } = position;

          function setFullScreen(id) {
            const width = window.innerWidth;
            const height = width / videoRate;
            const x = 0;
            const y = (window.innerHeight - height) / 2;
            const z = 0;
            savePosition(id, { ...position, x, y, z, size: { width, height } });
          }

          function setCenterScreen(id) {
            const height = window.innerHeight / 4;
            const width = height * videoRate;
            savePosition(id, {
              ...position,
              size: {
                width,
                height,
              },
              x: (window.innerWidth - width) / 2,
              y: -38,
              z: 2,
            });
          }

          return enabled ? (
            <Rnd
              key={id}
              disableDragging={!editabled}
              enableResizing={{
                top: editabled,
                right: editabled,
                bottom: editabled,
                left: editabled,
                topRight: editabled,
                bottomRight: editabled,
                bottomLeft: editabled,
                topLeft: editabled,
              }}
              className={classnames("ui-rnd", {
                disabled: !editabled,
                resized: size,
              })}
              lockAspectRatio={ratio === undefined ? true : ratio}
              position={position}
              size={size}
              onDragStop={(_, { x, y }) => {
                savePosition(id, { x, y, z, size, ratio });
              }}
              onResizeStop={(e, direction, ref, delta, { x, y }) => {
                const size = {
                  width: ref.offsetWidth,
                  height: ref.offsetHeight,
                };
                savePosition(id, { x, y, z, size, ratio });
              }}
              style={{ zIndex: positionMap[id]?.[orientation]?.z || index + 2 }}
            >
              {type === "joystick" && (
                <Joystick
                  disabled={editabled}
                  name={name}
                  onChange={(v) => onControl(id, v)}
                  autoReset={autoReset}
                  position={position}
                />
              )}
              {type === "slider" && (
                <JoystickSlider
                  vertical={vertical}
                  disabled={editabled}
                  name={name}
                  onChange={(v) => onControl(id, v)}
                  autoReset={autoReset}
                  position={position}
                />
              )}
              {type === "camera" && (
                <Camera
                  session={session}
                  editabled={editabled}
                  key={"camera" + cameraIndex}
                  index={cameraIndex}
                  url={setting.host && `${setting.host}/video${cameraIndex}`}
                  onChangeVideoRatio={(v) => {
                    if (ratio !== v) {
                      savePosition(id, { x, y, z, size, ratio });
                    }
                  }}
                  onClickFullScreen={() => setFullScreen(id)}
                  onClickCenterScreen={() => setCenterScreen(id)}
                  size={size}
                  rtcChannel={webrtcChannel[name]}
                />
              )}
            </Rnd>
          ) : undefined;
        }
      )}
    </>
  );
}
