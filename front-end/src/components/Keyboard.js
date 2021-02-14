import { useKeyPress } from "ahooks";
import React from "react";
import { Popover, Button } from "antd";

export default function Keyboard({
  playAudio,
  serverConfig,
  onEnter,
  changeChannel,
  channelList = [],
  channelStatus = {},
}) {
  useKeyPress(
    () => true,
    ({ type: keyType, key }) => {
      channelList.forEach(({ pin, keyboard = [], type }) => {
        keyboard.forEach(({ name, positive, method, speed }) => {
          if (name === key.toLocaleLowerCase()) {
            if (type === "switch" && keyType == "keydown") {
              const value = !channelStatus[pin];
              changeChannel({ pin, value });
              return;
            } else {
              const value = keyType === "keydown" ? (positive ? 1 : -1) : 0;
              changeChannel({ pin, value });
            }
          }
        });
      });
    },
    {
      events: ["keydown", "keyup"],
    }
  );
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
