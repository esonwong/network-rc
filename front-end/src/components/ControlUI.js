import React, { useState, useCallback, useMemo } from "react";
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

  const savePosition = useCallback(
    (id, position) => {
      if (!positionMap[id]) {
        positionMap[id] = {};
      }
      positionMap[id][orientation] = { ...position };
      setPositionMap({ ...positionMap });
    },
    [positionMap, orientation]
  );

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
      {list.map((i, index) => (
        <Item
          key={i.id}
          index={index}
          editabled={editabled}
          session={session}
          webrtcChannel={webrtcChannel}
          onControl={onControl}
          setting={setting}
          savePosition={savePosition}
          positionMap={positionMap}
          orientation={orientation}
          {...i}
        />
      ))}
    </>
  );
}

const Item = ({
  id,
  name,
  enabled,
  type,
  autoReset,
  cameraIndex,
  vertical,
  defaultPosition,
  positionMap,
  orientation,
  savePosition,
  editabled,
  onControl,
  session,
  webrtcChannel,
  setting,
  index,
}) => {
  let position = useMemo(
    () =>
      positionMap[id]?.[orientation] ||
      defaultPosition?.[orientation] || {
        x: index * 70,
        y: index * 30,
        z: positionMap[id]?.[orientation]?.z || index + 2,
        size: undefined,
        ratio: undefined,
      },
    [positionMap, id, orientation, defaultPosition, index]
  );

  const { size, z, ratio, videoRate = 4 / 3 } = position;

  const onChangeVideoRatio = useCallback(
    (v) => {
      const { size, z, x, y, ratio } = position;
      if (ratio !== v) {
        savePosition(id, { x, y, z, size, ratio: v });
      }
    },
    [savePosition, id, position]
  );

  const setFullScreen = useCallback(
    (id) => {
      const width = window.innerWidth;
      const height = width / videoRate;
      const x = 0;
      const y = (window.innerHeight - height) / 2;
      const z = 0;
      savePosition(id, { ...position, x, y, z, size: { width, height } });
    },
    [savePosition, videoRate, position]
  );

  const setCenterScreen = useCallback(
    (id) => {
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
    },
    [savePosition, position, videoRate]
  );

  const onDragStop = useCallback(
    (_, { x, y }) => {
      savePosition(id, { x, y, z, size, ratio });
    },
    [id, savePosition, z, size, ratio]
  );

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
      onDragStop={onDragStop}
      onResizeStop={(e, direction, ref, delta, { x, y }) => {
        const size = {
          width: ref.offsetWidth,
          height: ref.offsetHeight,
        };
        savePosition(id, { x, y, z, size, ratio });
      }}
      style={{ zIndex: positionMap[id]?.[orientation]?.z ?? index + 2 }}
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
          cameraIndex={"camera" + cameraIndex}
          index={cameraIndex}
          url={setting.host && `${setting.host}/video${cameraIndex}`}
          onChangeVideoRatio={onChangeVideoRatio}
          onClickFullScreen={() => setFullScreen(id)}
          onClickCenterScreen={() => setCenterScreen(id)}
          size={size}
          rtcChannel={webrtcChannel[name]}
        />
      )}
    </Rnd>
  ) : undefined;
};
