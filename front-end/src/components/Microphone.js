import React, { useEffect } from 'react'
import { useState } from 'react';
import { Button, message, Popover } from 'antd';

import { AudioOutlined } from "@ant-design/icons"
import gif from '../assets/开骂.gif'

export default function Microphone({ url }) {

  const [recordAudio, setRecordAudio] = useState(undefined);
  const [enabled, setEnabled] = useState(undefined);
  const [ws, setWs] = useState(undefined);
  const [recording, setRecording] = useState(false);

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
    setRecording(true)
    navigator.mediaDevices.getUserMedia({
      audio: true
    }).then(function (audioStream) {
      const record = new window.RecordRTC(audioStream, {
        type: 'audio',

        //6)
        mimeType: 'audio/wav',
        sampleRate: 48000,
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
    }).catch(function (e) {
      console.error(e)
      message.error(e.message)
    });
  }

  const endRecording = () => {

    setRecording(false)
    if (!recordAudio || !ws) return;
    recordAudio.stopRecording(function () {
      let blob = recordAudio.getBlob();
      ws.send(blob)
      message.success('发送语音')
    });
  }



  return (
    <Popover 
      visible={recording}
      placement="leftBottom"
      content={<img class="select-disabled" src={recording ? gif : ''} alt="录音中" />}
    >
      <Button
        className="record-button"
        size="large"
        disabled={!enabled}
        shape="circle"
        onMouseDown={startRecording}
        onMouseUp={endRecording}
        onTouchStart={startRecording}
        onTouchEnd={endRecording}
        icon={<AudioOutlined />}
      />
    </Popover>
  )
}
