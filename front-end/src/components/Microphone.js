import React, { useEffect } from 'react'
import { useState } from 'react';
import { Button, message } from 'antd';

import { AudioOutlined } from "@ant-design/icons"

export default function Microphone({ url }) {

  const [recordAudio, setRecordAudio] = useState(undefined);
  const [enabled, setEnabled] = useState(undefined);
  const [ws,  setWs] = useState(undefined);

  useEffect(() => {
    if (!url) return;
    const ws = new WebSocket(url);

    ws.addEventListener('open', () => { setEnabled(true) })
    ws.addEventListener('close', () => { setEnabled(false) })

    setWs(ws)

    return function () {
      ws && ws.close();
      setWs(undefined)
    }
  }, [url])

  const startRecording = () => {
    navigator.getUserMedia({
      audio: true
    }, function (audioStream) {
      const record = new window.RecordRTC(audioStream, {
        type: 'audio',

        //6)
        mimeType: 'audio/wav',
        sampleRate: 44100,
        // used by StereoAudioRecorder
        // the range 22050 to 96000.
        // let us force 16khz recording:
        // desiredSampRate: 16000,

        // MediaStreamRecorder, StereoAudioRecorder, WebAssemblyRecorder
        // CanvasRecorder, GifRecorder, WhammyRecorder
        recorderType: window.StereoAudioRecorder,
        // Dialogflow / STT requires mono audio
        numberOfAudioChannels: 1,
      });

      record.startRecording();

      setRecordAudio(record)
    }, function (error) {
      console.error(JSON.stringify(error));
    });
  }

  const endRecording = () => {
    if(!recordAudio || ! ws) return;
    recordAudio.stopRecording(function() {
      let blob = recordAudio.getBlob();
      ws.send(blob)
      message.success('发送语音')
  });
  }



  return (
    <div>
      <Button
        disabled={!enabled}
        shape="circle"
        onMouseDown={startRecording}
        onMouseUp={endRecording}
        onTouchStart={startRecording}
        onTouchEnd={endRecording}
        icon={<AudioOutlined />}
      />
    </div>
  )
}
