import { useKeyPress } from "@umijs/hooks";
import React from "react";
import { Popover, Button } from "antd";

export default function Keyboard({ playAudio, serverConfig, onEnter }) {
  useKeyPress("1", () => {
    playAudio({ path: serverConfig.audio1 });
  });
  useKeyPress("2", () => {
    playAudio({ path: serverConfig.audio2 });
  });
  useKeyPress("3", () => {
    playAudio({ path: serverConfig.audio3 });
  });
  useKeyPress("4", () => {
    playAudio({ path: serverConfig.audio4 });
  });

  useKeyPress("enter", onEnter);

  return (
    <Popover
      placement="topLeft"
      content={
        <p>
          发送文字转语音： 回车 <br />
          发送语音: 空格 <br />
          播放声音：1234 <br />
        </p>
      }
    >
      <Button shape="round">键盘</Button>
    </Popover>
  );
}
