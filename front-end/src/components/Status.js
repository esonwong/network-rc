import React from "react";
import { Form, Switch, Button, Tag } from "antd";
import { Link } from "@reach/router";
import {
  SettingOutlined,
  FullscreenOutlined,
  LinkOutlined,
  FullscreenExitOutlined,
  PoweroffOutlined,
  FormOutlined,
  HourglassOutlined,
  StopOutlined,
  DisconnectOutlined,
  DesktopOutlined,
  AudioOutlined,
  AudioMutedOutlined,
} from "@ant-design/icons";
import AudioPlayer from "./AudioPlayer";
import { useEventListener, useKeyPress } from "ahooks";

export default function Status({
  piPowerOff,
  wsConnected,
  delay = 0,
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
  onCarMicphoneChange,
  locked,
  onControllerMicphoneChange = () => {},
  enabledControllerMicphone = true,
}) {
  const isWebRTC = connectType === "webrtc";
  const { sharedEndTime } = serverConfig;

  const gamepadPress = ({ detail: { index, value } }) => {
    if (index === 3 && value > 0.5) {
      onControllerMicphoneChange(!enabledControllerMicphone);
    }
  };

  useKeyPress(
    "t",
    () => onControllerMicphoneChange(!enabledControllerMicphone),
    {
      events: ["keyup"],
    }
  );

  useEventListener("gamepadpress", gamepadPress);

  return (
    <Form layout="inline" className="app-status" size="small">
      <Form.Item>
        <Link to={`${process.env.PUBLIC_URL}/controller`}>
          <img className="logo" src="/logo-256.png" alt="N-RC" />
        </Link>
        <span>N RC</span>
      </Form.Item>
      <Form.Item>
        <Tag
          icon={
            locked ? (
              <StopOutlined />
            ) : wsConnected ? (
              <LinkOutlined />
            ) : (
              <DisconnectOutlined />
            )
          }
          color={locked || delay > 80 || !wsConnected ? "red" : "green"}
          size="xs"
        >
          {isWebRTC ? "直连" : "中转"}:{delay.toFixed(0)}
        </Tag>
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

      {isLogin && isWebRTC && (
        <Form.Item>
          <Switch
            checked={enabledControllerMicphone}
            onChange={onControllerMicphoneChange}
            checkedChildren={
              <>
                <DesktopOutlined /> <AudioOutlined />
              </>
            }
            unCheckedChildren={
              <>
                <DesktopOutlined /> <AudioMutedOutlined />
              </>
            }
          />
        </Form.Item>
      )}

      {isLogin && (
        <Form.Item>
          <AudioPlayer
            session={session}
            connectType={connectType}
            onMicphoneChange={onCarMicphoneChange}
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
