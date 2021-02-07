import React from "react";
import { Form, Switch, Dropdown, Button, Tag } from "antd";
import {
  HomeOutlined,
  FullscreenOutlined,
  ApiOutlined,
  BulbOutlined,
  FullscreenExitOutlined,
  ThunderboltOutlined,
  PoweroffOutlined,
} from "@ant-design/icons";
import { Location } from "@reach/router";
import Nav from "./Nav";
import Audio from "./Audio";

export default function Status({
  piPowerOff,
  wsConnected,
  connect,
  disconnect,
  powerEnabled,
  changePower,
  lightEnabled,
  changeLight,
  delay,
  isFullscreen,
  disabled,
  setting,
  isLogin,
  session,
}) {
  return (
    <Form layout="inline" className="app-status" size="small">
      <Form.Item>
        <Location>
          {({ navigate }) => (
            <Dropdown.Button
              overlay={<Nav />}
              onClick={() => navigate(`${process.env.PUBLIC_URL}/controller`)}
              type="primary"
            >
              <HomeOutlined /> 控制
            </Dropdown.Button>
          )}
        </Location>
      </Form.Item>
      <Form.Item>
        <Switch
          checked={wsConnected}
          onChange={(v) => {
            if (v) connect();
            else disconnect();
          }}
          unCheckedChildren={<ApiOutlined />}
          checkedChildren={<ApiOutlined />}
        />
      </Form.Item>
      <Form.Item>
        <Switch
          checked={powerEnabled}
          onChange={changePower}
          checkedChildren={<ThunderboltOutlined />}
          unCheckedChildren={<ThunderboltOutlined />}
          disabled={disabled}
        />
      </Form.Item>

      <Form.Item>
        <Switch
          checked={lightEnabled}
          onChange={changeLight}
          checkedChildren={<BulbOutlined />}
          unCheckedChildren={<BulbOutlined />}
          disabled={disabled}
        />
      </Form.Item>

      {isLogin && (
        <Form.Item>
          <Audio
            url={`${
              window.location.protocol === "https:" ? "wss://" : "ws://"
            }${setting.wsAddress}/microphone`}
          />
        </Form.Item>
      )}

      {document.body.requestFullscreen && (
        <Form.Item>
          <Button
            type="primary"
            shape="circle"
            icon={
              isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />
            }
            onClick={() => {
              if (isFullscreen) {
                document.exitFullscreen();
              } else {
                document.body.requestFullscreen();
              }
            }}
          ></Button>
        </Form.Item>
      )}
      {wsConnected && (
        <Form.Item>
          <Button
            type="danger"
            shape="circle"
            icon={<PoweroffOutlined />}
            onClick={piPowerOff}
          ></Button>
        </Form.Item>
      )}
      {wsConnected && delay && (
        <Form.Item>
          <Tag color={delay > 80 ? "red" : "green"}>
            ping:{delay.toFixed(0)}
          </Tag>
        </Form.Item>
      )}

      {wsConnected && session && session.endTime && (
        <Form.Item>
          <Tag>
            剩余:
            {((session.endTime - new Date().getTime()) / 1000).toFixed(0)}秒
          </Tag>
        </Form.Item>
      )}
    </Form>
  );
}
