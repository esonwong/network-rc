import React, { useEffect, useRef } from 'react'
import { useState } from 'react';
import { Switch, message } from 'antd';

import {
  AudioOutlined,
  AudioMutedOutlined,
} from "@ant-design/icons"

export default function Audio({
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
    function sourceopen() {
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

      ws.addEventListener('open', () => { 
        message.success('已连接到麦克风')
        setEnabled(true)
      })
      ws.addEventListener('close', () => { setEnabled(false) })
      
    }

    mediaSource.addEventListener('sourceopen', sourceopen);
    setSrc(URL.createObjectURL(mediaSource));
    return function () {
      ws && ws.close();
      mediaSource.removeEventListener("sourceopen",sourceopen);
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
