import { useKeyPress } from "ahooks";
import React, { useEffect } from "react";
import { Popover, Button } from "antd";
import localChannelStatus from "../lib/localChannelStatus";
let pressedKeyAndChannel = [];

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
      channelList.forEach((channel) => {
        const { pin, keyboard = [], type } = channel;
        keyboard.forEach((pressedKey) => {
          const { name, positive, method } = pressedKey;
          if (name === key.toLocaleLowerCase()) {
            console.log(keyType, key);
            if (type === "switch") {
              if (keyType === "keydown") {
                const value = !channelStatus[pin];
                changeChannel({ pin, value });
                return;
              }
            } else {
              if (method === "step") {
                if (keyType === "keydown") {
                  pressedKeyAndChannel.push({ pressedKey, channel });
                } else {
                  pressedKeyAndChannel = pressedKeyAndChannel.filter(
                    ({ pressedKey }) => pressedKey.key === key
                  );
                }
              } else {
                const value = keyType === "keydown" ? (positive ? 1 : -1) : 0;
                changeChannel({ pin, value });
              }
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
    playAudio({ stop: true });
  });

  useKeyPress("enter", onEnter);

  useEffect(() => {
    const timerId = setInterval(() => {
      pressedKeyAndChannel.forEach(
        ({ pressedKey: { positive, speed = 0.5 }, channel: { pin } }) => {
          let value =
            (localChannelStatus[pin] || 0) + ((positive ? 1 : -1) * speed) / 20;
          if (value > 1) value = 1;
          if (value < -1) value = -1;
          changeChannel({ pin, value });
        }
      );
    }, 50);
    return () => {
      clearInterval(timerId);
    };
  }, [changeChannel]);

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
