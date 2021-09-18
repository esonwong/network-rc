import React from "react";
import { Form, Switch, Button, Tag } from "antd";
import { Link } from "@reach/router";
import {
  SettingOutlined,
  FullscreenOutlined,
  ApiOutlined,
  FullscreenExitOutlined,
  PoweroffOutlined,
  FormOutlined,
  HourglassOutlined,
  StopOutlined,
} from "@ant-design/icons";
import CarMicphone from "./CarMicphone";

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
  version,
  connectType,
  onMicphoneChange,
  locked,
}) {
  const { sharedEndTime } = serverConfig;
  return (
    <Form layout="inline" className="app-status" size="small">
      <Form.Item>
        <Link to={`${process.env.PUBLIC_URL}/controller`}>
          <img className="logo" src="/logo-256.png" alt="N-RC" />
        </Link>
        <span>N RC</span>
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
      {isLogin && (
        <Form.Item>
          <CarMicphone
            session={session}
            connectType={connectType}
            onMicphoneChange={onMicphoneChange}
            url={`${
              window.location.protocol === "https:" ? "wss://" : "ws://"
            }${setting.host}/microphone`}
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

      <Form.Item>
        <Link to={`${process.env.PUBLIC_URL}/setting`}>
          <Button
            size="small"
            icon={<SettingOutlined />}
            shape="circle"
          ></Button>
        </Link>
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
          <Tag
            icon={locked ? <StopOutlined /> : undefined}
            color={locked || delay > 80 ? "red" : "green"}
          >
            {connectType}:{delay.toFixed(0)}
          </Tag>
        </Form.Item>
      )}

      {wsConnected && sharedEndTime && (
        <Form.Item>
          <Tag
            icon={<HourglassOutlined />}
            color={session && session.endTime && "orange"}
          >
            {((sharedEndTime - new Date().getTime()) / 1000).toFixed(0)}s
          </Tag>
        </Form.Item>
      )}

      {version && (
        <Form.Item>
          <Tag>v{version}</Tag>
        </Form.Item>
      )}
    </Form>
  );
}
