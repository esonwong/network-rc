import React, { useCallback } from "react";
import Joystick from "./Joystick";
import Camera from "./Camera";
import { Rnd } from "react-rnd";
import { useCreation, useEventListener } from "ahooks";
import "./ControlUI.scss";
import classnames from "classnames";
import JoystickSlider from "./JoystickSlider";
import { useSelector, useDispatch } from "react-redux";
import { updatePositionMap, setOrientation } from "../store/ui";

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
  const positionMap = useSelector((state) => state.ui.positionMap);
  const orientation = useSelector((state) => state.ui.orientation);
  const dispatch = useDispatch();

  useCreation(() => {
    dispatch(setOrientation(screenDirction.matches ? "portrait" : "landscape"));
  });

  useEventListener(
    "change",
    ({ matches }) => {
      dispatch(setOrientation(matches ? "portrait" : "landscape"));
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
      i.x = 0;
      i.y = 0;
      return i;
    }),
    ...(isShowButton ? uiComponentList : []),
  ];

  return (
    <>
      {list.map((i, index) => {
        const { id } = i;
        const position = positionMap[id]?.[orientation];

        return (
          <Item
            key={i.id}
            index={index}
            editabled={editabled}
            session={session}
            webrtcChannel={webrtcChannel}
            onControl={onControl}
            setting={setting}
            onPositionChange={(position) =>
              dispatch(updatePositionMap({ orientation, id, position }))
            }
            position={position}
            {...i}
          />
        );
      })}
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
  index,
  position = { x: index * 20, y: index * 20, z: index + 2, videoRate: 4 / 3 },
  onPositionChange,
  editabled,
  onControl,
  session,
  webrtcChannel,
  setting,
}) => {
  const {
    x = index * 20,
    y = index * 20,
    z = index + 2,
    videoRate = 4 / 3,
    ratio,
    size = undefined,
  } = position;

  const onChangeVideoRatio = useCallback(
    (v) => {
      if (v === ratio) return;
      onPositionChange({ ratio: v });
    },
    [ratio, onPositionChange]
  );

  const setFullScreen = useCallback(
    (id) => {
      const width = window.innerWidth;
      const height = width / videoRate;
      const x = 0;
      const y = (window.innerHeight - height) / 2;
      const z = 0;
      onPositionChange({ ...position, x, y, z, size: { width, height } });
    },
    [onPositionChange, videoRate, position]
  );

  const setCenterScreen = useCallback(
    (id) => {
      const height = window.innerHeight / 4;
      const width = height * videoRate;
      onPositionChange({
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
    [onPositionChange, position, videoRate]
  );

  const onDragStop = useCallback(
    (_, { x, y }) => {
      onPositionChange({ x, y });
    },
    [onPositionChange]
  );

  return enabled ? (
    <Rnd
      key={`rnd-${id}`}
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
      position={{ x, y }}
      size={size}
      onDragStop={onDragStop}
      onResizeStop={(e, direction, ref, delta, { x, y }) => {
        const size = {
          width: ref.offsetWidth,
          height: ref.offsetHeight,
        };
        onPositionChange({ x, y, z, size });
      }}
      style={{ zIndex: position?.z ?? index + 2 }}
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
          onChangeVideoRatio={(v) => onChangeVideoRatio(v)}
          onClickFullScreen={() => setFullScreen(id)}
          onClickCenterScreen={() => setCenterScreen(id)}
          size={size}
          rtcChannel={webrtcChannel[name]}
        />
      )}
    </Rnd>
  ) : undefined;
};
