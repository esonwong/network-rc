import React, { useEffect, useRef } from 'react'
import WSAvcPlayer from "ws-avc-player";
import { Rnd } from 'react-rnd'
import { useState } from 'react';
import { Button } from 'antd';
import { useCreation, useMount } from '@umijs/hooks';
import store from "store";

import {
  BorderOutlined,
  UpSquareOutlined,
  RotateRightOutlined,
  PauseOutlined,
  PlayCircleOutlined,
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
  const [enabled, setEnabled] = useState(false);
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
      resize(size);
    })
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
    const height = window.innerHeight;
    const width = height / videoSize.height * videoSize.width;
    setSize({ width, height });
    resize({ width, height });
    setPosition({ x: (window.innerWidth - width) / 2, y: -38, z: 0 });
  }

  function setCenterScreen() {
    const height = window.innerHeight / 4;
    const width = height / videoSize.height * videoSize.width;
    const position = { x: (window.innerWidth - width) / 2, y: -38, z: 2 }
    setPosition(position)
    setSize({ width, height });
    resize({ width, height });
  }

  function start() {
    wsavc.connect(`${window.location.protocol === "https:" ? "wss://" : "ws://"}${url}`);
  }

  function resize(payload) {
    wsavc && wsavc.send("resize", payload)
  }

  useEffect(() => {
    start();
    const box = boxEl.current;
    box.appendChild(wsavc.AvcPlayer.canvas);
    wsavc.on("initalized", (payload) => {
      console.log("initalized", payload);
      setVideoSize(payload);
    });
    wsavc.on("disconnected", function () {
      setEnabled(false);
    });
    return function () {
      wsavc.disconnect();
      box.removeChild(wsavc.AvcPlayer.canvas);
    }
    // eslint-disable-next-line
  }, [url, wsavc]);


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
        resize(size);
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
            enabled ?
              <Button size="small" type="danger" shape="circle" icon={
                <PauseOutlined />
              } onClick={() => {
                wsavc.ws.close();
              }} /> :
              <Button size="small" type="primary" shape="circle" icon={
                <PlayCircleOutlined />
              } onClick={start} />
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
