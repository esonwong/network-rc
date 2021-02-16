import React, { useEffect, useRef } from "react";
import WSAvcPlayer from "ws-avc-player";
import { useState } from "react";
import { Button, Switch, message, Select } from "antd";
import { useCreation, useDebounceEffect, useEventListener } from "ahooks";
import store from "store";
import {
  BorderOutlined,
  ExpandAltOutlined,
  RotateRightOutlined,
} from "@ant-design/icons";

const { Option } = Select;

function open(enabled, pause, wsavc, payload) {
  enabled && !pause && wsavc && wsavc.ws && wsavc.send("open-request", payload);
}

export default function Camera({
  url,
  editabled,
  size,
  onChangeVideoRatio,
  onClickFullScreen,
  onClickCoverScreen,
}) {
  const storeName = `camera-${url}`;
  const boxEl = useRef(null);
  const [enabled, setEnabled] = useState(false);
  const [pause, setPause] = useState(false);
  const [cameraName, setCameraName] = useState("");
  const [formatList, setFormatList] = useState([]);
  const [inputFormatIndex, setInputFormatIndex] = useState(undefined);
  const [fps, setFps] = useState(30);
  const [rotate, setRotate] = useState(0); // 旋转
  const [connected, setConneected] = useState(false);

  const wsavc = useCreation(() => {
    const { rotate = 0, enabled = true, inputFormatIndex = 0, fps = 30 } =
      store.get(storeName) || {};
    setEnabled(enabled);
    setRotate(rotate);
    setInputFormatIndex(inputFormatIndex);
    setFps(fps);
    const w = new WSAvcPlayer({
      useWorker: true,
      workerFile: `${process.env.PUBLIC_URL}/Decoder.js`,
    });

    w.on("connected", function () {
      setConneected(true);
    });

    w.on("info", ({ cameraName, size: { width, height }, formatList }) => {
      setCameraName(cameraName);
      w.cameraName = cameraName;
      setFormatList(formatList);
      onChangeVideoRatio(width / height);
    });

    w.on("open", ({ inputFormatIndex, fps }) => {
      setInputFormatIndex(inputFormatIndex);
      setFps(fps);
    });

    // w.on("resized", ({ width, height }) => {
    // message.success(`${w.cameraName} 开启 ${width}x${height}`);
    // });

    w.on("disconnected", function () {
      setConneected(false);
    });

    return w;
  });

  function changeRotate() {
    if (rotate === 270) {
      setRotate(0);
    } else {
      setRotate(rotate + 90);
    }
  }

  // function setFullScreen() {
  //   const width = window.innerWidth;
  //   const height = width / videoRate;
  //   setViewSize({ width, height });
  //   setPosition({ x: 0, y: (window.innerHeight - height) / 2, z: 0 });
  // }

  // function setCenterScreen() {
  //   const height = window.innerHeight / 4;
  //   const width = height * videoRate;
  //   const position = { x: (window.innerWidth - width) / 2, y: -38, z: 2 };
  //   setPosition(position);
  //   setViewSize({ width, height });
  // }

  function start() {
    wsavc.connect(
      `${window.location.protocol === "https:" ? "wss://" : "ws://"}${url}`
    );
  }

  function end() {
    wsavc && wsavc.ws && wsavc.disconnect();
    wsavc.AvcPlayer.canvas.remove();
  }

  useEventListener(
    "visibilitychange",
    function () {
      if (document.visibilityState === "visible") {
        setPause(false);
      } else {
        setPause(true);
      }
    },
    { dom: document }
  );

  useDebounceEffect(
    () => {
      connected && open(enabled, pause, wsavc, { inputFormatIndex, fps, size });
    },
    [enabled, pause, wsavc, fps, inputFormatIndex, size, connected],
    {
      wait: 500,
    }
  );

  useDebounceEffect(
    () => {
      const box = boxEl.current;

      if (!enabled || pause) {
        end();
      } else {
        start();
        box.appendChild(wsavc.AvcPlayer.canvas);
      }
      return function () {
        end();
      };
      // eslint-disable-next-line
    },
    [url, wsavc, enabled, pause],
    {
      wait: 500,
    }
  );

  useEffect(() => {
    store.set(storeName, { rotate, enabled, inputFormatIndex });
  }, [storeName, rotate, enabled, inputFormatIndex]);

  return (
    <div className="camera">
      {editabled ? (
        <div className="button-box transition-animation" title={cameraName}>
          {<Switch size="small" checked={enabled} onChange={setEnabled} />}
          <Button
            size="small"
            shape="circle"
            icon={<BorderOutlined />}
            onClick={onClickFullScreen}
          />
          <Button
            size="small"
            shape="circle"
            icon={<ExpandAltOutlined />}
            onClick={onClickCoverScreen}
          />
          <Button
            size="small"
            shape="circle"
            icon={<RotateRightOutlined />}
            onClick={changeRotate}
          />
          <Select
            defaultValue={inputFormatIndex}
            onChange={setInputFormatIndex}
            size="small"
          >
            {formatList.map(({ format, size }, index) => (
              <Option value={index}>{`${size} ${format}`}</Option>
            ))}
          </Select>
          <Select defaultValue={fps} onChange={setFps} size="small">
            <Option value={15}>15 fps</Option>
            <Option value={30}>30 fps</Option>
            <Option value={60}>60 fps</Option>
          </Select>
        </div>
      ) : undefined}
      <div
        className="camera-box"
        ref={boxEl}
        style={{
          transform: `rotate(${rotate}deg)`,
        }}
      ></div>
    </div>
  );
}
