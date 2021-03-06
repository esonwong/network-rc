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
      audioList.forEach(({ path, text, keyboard = "", type }) => {
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
      overlayClassName="popovertip"
      content={
        <Descriptions title="??????" bordered>
          <Descriptions.Item label="????????????">
            {audioList.map(({ name, keyboard = "", type }, index) => (
              <p key={`${name}-${index}`}>
                {type === "stop" ? (
                  "????????????"
                ) : (
                  <>
                    ?????? <Text code>{name}</Text>
                  </>
                )}
                :<Text keyboard>{keyboard}</Text>
              </p>
            ))}
          </Descriptions.Item>
          {channelList.map(({ pin, name, keyboard = [], type }) => (
            <Descriptions.Item
              key={pin}
              label={
                <>
                  {name} <Text code>??????:{pin}</Text>
                </>
              }
            >
              {keyboard.map(({ name: key, speed, autoReset }) => (
                <p key={key}>
                  {name}
                  <Text code>
                    {type}:{speed}
                  </Text>
                  :<Text keyboard>{key}</Text>
                  {autoReset && <Text type="secondary">????????????</Text>}
                </p>
              ))}
            </Descriptions.Item>
          ))}
          <Descriptions.Item label="?????????????????????">
            <Text keyboard>??????</Text>
          </Descriptions.Item>
          <Descriptions.Item label="????????????/????????????????????????">
            <Text keyboard>??????</Text>
          </Descriptions.Item>
        </Descriptions>
      }
    >
      <Button shape="round">??????</Button>
    </Popover>
  );
}
