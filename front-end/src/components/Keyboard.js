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
  const { audioList } = serverConfig;

  // channel
  useKeyPress(
    () => true,
    ({ type: keyType, key }) => {
      console.log(key, keyType);

      // channel
      channelList.forEach((channel) => {
        const { pin, keyboard = [], type } = channel;
        keyboard.forEach((pressedKey) => {
          const { name, speed, method, autoReset } = pressedKey;
          if (name.toLocaleLowerCase() === key.toLocaleLowerCase()) {
            if (type === "switch") {
              if (keyType === "keydown") {
                const value = !channelStatus[pin];
                changeChannel({ pin, value });
                return;
              }

              if (keyType === "keyup" && autoReset) {
                changeChannel({ pin, value: 0 });
                return;
              }
            } else {
              if (method === "step") {
                if (keyType === "keydown") {
                  pressedKeyAndChannel.push({ pressedKey, channel });
                }
                if (keyType === "keyup") {
                  pressedKeyAndChannel = pressedKeyAndChannel.filter(
                    ({ pressedKey }) => pressedKey.key === key
                  );
                }
              } else {
                if (keyType === "keydown") {
                  changeChannel({ pin, value: speed });
                }
                if (keyType === "keyup" && autoReset) {
                  changeChannel({ pin, value: 0 });
                }
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

  useKeyPress(
    () => true,
    ({ key }) => {
      audioList.forEach(({ path, text, keyboard }) => {
        if (keyboard.toLocaleLowerCase() === key.toLocaleLowerCase())
          playAudio({ path, text });
      });
    },
    { events: ["keydown"] }
  );

  useKeyPress("enter", onEnter);

  useEffect(() => {
    console.log("changeChannel change");
    const interval = 100;
    const timerId = setInterval(() => {
      pressedKeyAndChannel.forEach(
        ({ pressedKey: { positive, speed = 0.5 }, channel: { pin } }) => {
          let value =
            (localChannelStatus[pin] || 0) +
            ((positive ? 1 : -1) * speed) / (1000 / interval);
          if (value > 1) value = 1;
          if (value < -1) value = -1;
          changeChannel({ pin, value });
        }
      );
    }, interval);
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
