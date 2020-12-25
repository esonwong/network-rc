import React, { useEffect, useRef } from 'react'
import WSAvcPlayer from "ws-avc-player";
import { Rnd } from 'react-rnd'
import { useState } from 'react';
import { Button, Switch, message } from 'antd';
import { useCreation, useEventListener } from '@umijs/hooks';
import store from "store";

import {
  BorderOutlined,
  UpSquareOutlined,
  RotateRightOutlined,
  FormOutlined,
  LockOutlined
} from "@ant-design/icons"

export default function Camera({
  url,
  index = 0,
  defaultPosition = { x: index * 20, y: 0, z: 1 },
  defaultSize = { width: 400, height: 300, },
}) {

  const storeName = `camera-${url}`;
  const boxEl = useRef(null);

  const [position, setPosition] = useState(defaultPosition)
  const [size, setSize] = useState(defaultSize); // 画布大小
  const [rotate, setRotate] = useState(0);
  const [videoSize, setVideoSize] = useState({ width: 400, height: 300 }); // 视频分辨率
  const [enabled, setEnabled] = useState(true);
  const [pause, setPause] = useState(false);
  const [editabled, setEditabled] = useState(false);

  const wsavc = useCreation(() => {
    const { size, position } = store.get(storeName) || { size: defaultSize, position: defaultPosition };
    setPosition(position);
    setSize(size);
    const w = new WSAvcPlayer({
      useWorker: true,
      workerFile: `${process.env.PUBLIC_URL}/Decoder.js`,
    });

    w.on('connected', function () {
      setEnabled(true);
      reCameraSize(size);
    })

    w.on("info", ({ cameraName, size }) => {
      setVideoSize(size);
    });

    w.on("initalized", ({ cameraName, size }) => {
      message.success(`${cameraName} 开启 ${size.width}x${size.height}`)
      setVideoSize(size);
    });

    w.on("disconnected", function () {
      // setEnabled(false);
    });

    return w
  });



  function changeRotate() {
    if (rotate === 270) {
      setRotate(0);
    } else {
      setRotate(rotate + 90);
    }
  }


  function setFullScreen() {
    const width = window.innerWidth;
    const height = width / videoSize.width * videoSize.height;
    setSize({ width, height });
    reCameraSize({ width, height });
    setPosition({ x: 0, y: (window.innerHeight - height) / 2, z: 0 });
  }

  function setCenterScreen() {
    const height = window.innerHeight / 4;
    const width = height / videoSize.height * videoSize.width;
    const position = { x: (window.innerWidth - width) / 2, y: -38, z: 2 }
    setPosition(position)
    setSize({ width, height });
    reCameraSize({ width, height });
  }

  function start() {
    wsavc.connect(`${window.location.protocol === "https:" ? "wss://" : "ws://"}${url}`);
  }

  function end() {
    wsavc && wsavc.ws && wsavc.disconnect();
    wsavc.AvcPlayer.canvas.remove();
  }

  function reCameraSize(payload) {
    wsavc && wsavc.ws && wsavc.send("resize", payload)
  }

  useEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      setPause(false)
    }
    else {
      setPause(true)
    }
  }, { dom: document })

  useEffect(() => {
    const box = boxEl.current;
    if (!enabled || pause) {
      end()
    } else {
      start();
      box.appendChild(wsavc.AvcPlayer.canvas);
    }
    return function () {
      end()
    }
    // eslint-disable-next-line
  }, [url, wsavc, enabled, pause]);


  return (
    <Rnd
      disableDragging={!editabled}
      enableResizing={{ top: editabled, right: editabled, bottom: editabled, left: editabled, topRight: editabled, bottomRight: editabled, bottomLeft: editabled, topLeft: editabled }}
      className={editabled ? "camera-rnd" : "camera-rnd disabled"}
      lockAspectRatio={videoSize.width / videoSize.height}
      tabIndex={1}
      size={size}
      position={position}
      onDragStop={(e, { x, y }) => {
        const p = { x, y, z: position.z };
        setPosition(p);
      }}
      onResizeStop={(e, direction, ref, delta, { x, y }) => {
        const p = { x, y, z: position.z };
        setPosition(p)
        const size = {
          width: ref.offsetWidth,
          height: ref.offsetHeight
        };
        setSize(size);
        reCameraSize(size);
      }}
      style={{ zIndex: position.z }}
    >
      {editabled ?
        <div className="button-box transition-animation">
          <Button size="small" shape="circle" icon={<BorderOutlined />} onClick={setFullScreen} />
          <Button size="small" shape="circle" icon={<UpSquareOutlined />} onClick={setCenterScreen} />
          <Button size="small" shape="circle" icon={<RotateRightOutlined />} onClick={changeRotate} />
          <Button size="small" shape="circle" icon={<LockOutlined />} onClick={() => {
            setEditabled(false)
            store.set(storeName, { size, position });
          }} />
        </div>
        : <div className="edit">
          <Button size="small" shape="circle" icon={<FormOutlined />} onClick={() => { setEditabled(true) }} />
          <br />
          {
            <Switch size="small" checked={enabled} onChange={setEnabled} />
          }
        </div>
      }
      <div className="camera-box" ref={boxEl}
        style={{
          transform: `rotate(${rotate}deg)`
        }}
      >
      </div>
    </Rnd>
  )
}
