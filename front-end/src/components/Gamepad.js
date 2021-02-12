import { useEventListener, useMount } from "@umijs/hooks";
import React, { useEffect, useState } from "react";
import { Space, Switch, Select, Button, message, Popover } from "antd";
import Icon from "./Icon";
const { Option } = Select;

let gamePadsTimerId,
  updateTime,
  status = {};

const gamePadsLoop = ({ index }) => {
  gamePadsTimerId = setInterval(() => {
    const gamepad = (navigator.getGamepads
      ? navigator.getGamepads()
      : navigator.webkitGetGamepads
      ? navigator.webkitGetGamepads
      : [])[index];
    if (!gamepad) return;
    const { connected, timestamp } = gamepad;

    if (!connected || updateTime === timestamp) return;
    updateTime = timestamp;
    window.dispatchEvent(
      new CustomEvent("gamepadchange", {
        detail: gamepad,
      })
    );
  }, 10);
};

export default function Gamepad({
  channelList = [],
  changeChannel = function () {},
}) {
  const [enabled, setEnabled] = useState(false);
  const [gamepadList, setGamepadList] = useState([]);

  const [current, setCurrent] = useState(undefined);

  useMount(() => {
    const list = [];
    const gamepadList = navigator.getGamepads
      ? navigator.getGamepads()
      : navigator.webkitGetGamepads
      ? navigator.webkitGetGamepads
      : [];
    for (
      let gamePadIndex = 0;
      gamePadIndex < gamepadList.length;
      gamePadIndex++
    ) {
      const gamepad = gamepadList[gamePadIndex];
      gamepad && list.push(gamepad);
    }
    setGamepadList([...list]);
  });
  useEventListener("gamepadconnected", ({ gamepad }) => {
    const { index, id } = gamepad;
    message.success(`控制器已连接于 ${index} 位: ${id}。`);
    gamepadList.push(gamepad);
    setGamepadList([...gamepadList]);
    setCurrent(gamepad);
    setEnabled(true);
  });

  useEventListener("gamepadchange", ({ detail: { buttons, axes } }) => {
    channelList.forEach(({ gamepad = [], pin }) => {
      gamepad.forEach(({ name, positive, method, speed }) => {
        const [type, index] = name.split("-");
        const coefficient = positive ? 1 : -1;
        let value;
        switch (type) {
          case "button":
            value = coefficient * buttons[index - 0].value;
            break;
          case "axis":
            value = coefficient * axes[index - 0];
            break;

          default:
            return;
        }
        if (status[name] === value) return;
        status[name] = value;
        changeChannel({ pin, value });
      });
    });
  });

  useEffect(() => {
    if (enabled && current) {
      gamePadsLoop(current);
    } else {
      clearInterval(gamePadsTimerId);
    }
    return function () {
      gamePadsTimerId && clearInterval(gamePadsTimerId);
    };
  }, [enabled, current]);

  return (
    <Space>
      <Switch
        checked={enabled}
        onChange={setEnabled}
        unCheckedChildren={<Icon type="icon-game-" />}
        checkedChildren={<Icon type="icon-game-" />}
      />
      <Popover
        placement="topLeft"
        content={
          <Select
            value={current && current.id}
            onChange={(id) => setCurrent(gamepadList.find((i) => i.id === id))}
          >
            {gamepadList.map((gamepad) => {
              return (
                <Option key={gamepad.id} value={gamepad.id}>
                  {gamepad.id}
                </Option>
              );
            })}
          </Select>
        }
      >
        <Button shape="round">选择手柄</Button>
      </Popover>
    </Space>
  );
}
