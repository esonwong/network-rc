import React from 'react'
import Camera from "./Camera";

export default function CameraContainer({
  cameraList, setting
}) {
  return (
    <div className="camera-container">
      {cameraList.map(({ index }) => <Camera key={index} index={index} url={`${setting.wsAddress}/video${index}`} />)}
    </div>
  )
}