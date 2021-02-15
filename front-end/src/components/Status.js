import React from "react";
import { Form, Switch, Dropdown, Button, Tag, Space } from "antd";
import {
  HomeOutlined,
  FullscreenOutlined,
  ApiOutlined,
  FullscreenExitOutlined,
  PoweroffOutlined,
  FormOutlined,
} from "@ant-design/icons";
import { Location } from "@reach/router";
import Nav from "./Nav";
import Audio from "./Audio";

export default function Status({
  piPowerOff,
  wsConnected,
  connect,
  disconnect,
  delay,
  isFullscreen,
  setting,
  isLogin,
  session,
  changeEditabled,
  channelStatus,
  changeChannel,
  serverConfig,
}) {
  const { sharedDuration, sharedEndTime } = serverConfig;
  return (
    <Form layout="inline" className="app-status" size="small">
      <Form.Item>
        <Location>
          {({ navigate }) => (
            <Dropdown.Button
              overlay={<Nav />}
              onClick={() => navigate(`${process.env.PUBLIC_URL}/controller`)}
              type="primary"
              trigger="click"
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
      <Space>
        {(serverConfig.channelList || [])
          .filter(({ enabled, type }) => enabled && type === "switch")
          .map(({ pin, name }) => (
            <Form.Item key={pin}>
              <Switch
                checked={channelStatus[pin] || false}
                checkedChildren={name}
                unCheckedChildren={name}
                onChange={(value) => changeChannel({ pin, value })}
              />
            </Form.Item>
          ))}
      </Space>
      {isLogin && (
        <Form.Item>
          <Audio
            url={`${
              window.location.protocol === "https:" ? "wss://" : "ws://"
            }${setting.wsAddress}/microphone`}
          />
        </Form.Item>
      )}

      <Form.Item>
        <Switch
          checkedChildren={<FormOutlined />}
          unCheckedChildren={<FormOutlined />}
          onChange={changeEditabled}
        ></Switch>
      </Form.Item>

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

      {wsConnected && sharedEndTime && (
        <Form.Item>
          <Tag color={session && session.endTime && "orange"}>
            剩余:
            {((sharedEndTime - new Date().getTime()) / 1000).toFixed(0)}s
          </Tag>
        </Form.Item>
      )}
    </Form>
  );
}
