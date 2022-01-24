import { useKeyPress } from "ahooks";
import React, { useEffect } from "react";
import { Popover, Button } from "antd";
import localChannelStatus from "../lib/localChannelStatus";
import { Descriptions, Typography } from "antd";
let pressedKeyAndChannel = [];

const { Text } = Typography;

export default function Keyboard({
  playAudio,
  serverConfig,
  onEnter,
  changeChannel,
  channelList = [],
  channelStatus = {},
}) {
  const { audioList = [] } = serverConfig;

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
      audioList.forEach(({ path, text, keyboard, type }) => {
        if (keyboard.toLocaleLowerCase() === key.toLocaleLowerCase())
          switch (type) {
            case "audio":
              playAudio({ path });
              break;
            case "text":
              playAudio({ text });
              break;
            case "stop":
              playAudio({ stop: true });
              break;
            default:
              break;
          }
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
        <Descriptions title="键盘" bordered>
          <Descriptions.Item label="播放声音">
            {audioList.map(({ name, keyboard, type }) => (
              <p>
                {type === "stop" ? (
                  "停止播放"
                ) : (
                  <>
                    播放 <Text code>{name}</Text>
                  </>
                )}
                :<Text keyboard>{keyboard}</Text>
              </p>
            ))}
          </Descriptions.Item>
          {channelList.map(({ pin, name, keyboard = [], type }) => (
            <Descriptions.Item
              label={
                <>
                  {name} <Text code>通道:{pin}</Text>
                </>
              }
            >
              {keyboard.map(({ name: key, speed, autoReset }) => (
                <p>
                  {name}
                  <Text code>
                    {type}:{speed}
                  </Text>
                  :<Text keyboard>{key}</Text>
                  {autoReset && <Text type="secondary">释放归位</Text>}
                </p>
              ))}
            </Descriptions.Item>
          ))}
          <Descriptions.Item label="发送文字转语音">
            <Text keyboard>回车</Text>
          </Descriptions.Item>
          <Descriptions.Item label="发送语音">
            <Text keyboard>空格</Text>
          </Descriptions.Item>
        </Descriptions>
      }
    >
      <Button shape="round">⌨️</Button>
    </Popover>
  );
}
