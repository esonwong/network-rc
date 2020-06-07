import React, { useEffect, useRef } from 'react'
import WSAvcPlayer from "ws-avc-player";
import { Rnd } from 'react-rnd'
import { useState } from 'react';
import { Button } from 'antd';
import { useCreation } from '@umijs/hooks';

import {
  BorderOutlined,
  UpSquareOutlined,
  RotateRightOutlined,
  PauseOutlined,
  PlayCircleOutlined
} from "@ant-design/icons"

export default function Camera({
  url,
  defaultPosition = { x: 0, y: 0 },
  defaultSize = { width: 400, height: 300 }
}) {
  const boxEl = useRef(null);
  const wsavc = useCreation(() => new WSAvcPlayer({
    useWorker: true,
    workerFile: `${process.env.PUBLIC_URL}/Decoder.js`,
  }));
  const [position, setPosition] = useState(defaultPosition)
  const [size, setSize] = useState(defaultSize);
  const [zIndex, setZIndex] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [videoSize, setVideoSize] = useState({ width: 400, height: 300 });
  const [enabled, setEnabled] = useState(false)




  function setFullScreen() {
    const height = window.innerHeight;
    const width = height / videoSize.height * videoSize.width;
    setSize({ width, height });
    resize({ width, height });
    setPosition({ x: (window.innerWidth - width) / 2, y: -38 });
    setZIndex(0);
  }

  function setCenterScreen() {
    const width = window.innerWidth / 4;
    const height = width / videoSize.width * videoSize.height;
    setPosition({ x: window.innerWidth / 8 * 3, y: -38, zIndex: 2 })
    setSize({ width, height });
    resize({ width, height }); resize({ width, height });
    setZIndex(2);
  }

  function start() {
    wsavc.connect(`${window.location.protocol === "https:" ? "wss://" : "ws://"}${url}`);
  }

  function resize(payload) {
    wsavc.send("resize", payload)
  }

  useEffect(() => {
    start();
    const box = boxEl.current;
    box.appendChild(wsavc.AvcPlayer.canvas);
    wsavc.on("initalized", (payload) => {
      console.log("initalized", payload);
      setVideoSize(payload);
      setEnabled(true);
    });
    wsavc.on("disconnected", function () {
      setEnabled(false);
    });
    return function () {
      wsavc.disconnect();
      box.removeChild(wsavc.AvcPlayer.canvas);
    }
  }, [url, wsavc]);


  return (
    <Rnd
      className="camera-rnd"
      lockAspectRatio={videoSize.width / videoSize.height}
      tabIndex={1}
      size={size}
      position={position}
      onDragStop={(e, d) => {
        setPosition(d);
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        setPosition(position)
        const size = {
          width: ref.style.width,
          height: ref.style.height
        };
        setSize(size);
        resize({
          width: size.width.replace("px", ""),
          height: size.height.replace("px", "")
        });
      }}
      style={{ zIndex }}
    >
      <div className="button-box transition-animation">
        <Button size="small" shape="circle" icon={<BorderOutlined />} onClick={setFullScreen} />
        <Button size="small" shape="circle" icon={<UpSquareOutlined />} onClick={setCenterScreen} />
        <Button size="small" shape="circle" icon={<RotateRightOutlined />} onClick={() => {
          if (rotate === 270) {
            setRotate(0);
          } else {
            setRotate(rotate + 90);
          }
        }} />
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
      <div className="camera-box" ref={boxEl}
        style={{
          transform: `rotate(${rotate}deg)`
        }}
      >
      </div>
    </Rnd>
  )
}
