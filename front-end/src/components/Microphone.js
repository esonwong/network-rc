import React, { useEffect, useRef } from 'react'
import { useState } from 'react';
import { Switch } from 'antd';

import {
  AudioOutlined,
  AudioMutedOutlined,
} from "@ant-design/icons"

export default function Camera({
  url,
}) {

  const audioEl = useRef(null);
  const [enabled, setEnabled] = useState(true);
  const [src, setSrc] = useState(null);


  useEffect(() => {
    if (!audioEl.current || !enabled) return;
    const mediaSource = new MediaSource();
    let ws;
    let buffer = [];
    mediaSource.addEventListener('sourceopen', function () {
      var sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');
      setInterval(() => {
        if (buffer.length && !sourceBuffer.updating) {
          sourceBuffer.appendBuffer(buffer.shift());
        }
      }, 10);

      function onAudioLoaded({ data }) {
        buffer.push(data);
      }

      ws = new WebSocket(url);
      ws.binaryType = "arraybuffer";
      ws.addEventListener("message", onAudioLoaded);
    });
    setSrc(URL.createObjectURL(mediaSource));
    return function () {
      ws.close();
    }
  }, [audioEl, enabled, url])



  return (
    <div>
      <audio ref={audioEl} src={src} autoPlay></audio>
      <Switch
        checked={enabled}
        onChange={v => {
          setEnabled(v);
        }}
        checkedChildren={<AudioOutlined />}
        unCheckedChildren={<AudioMutedOutlined />}
      />
    </div>
  )
}
