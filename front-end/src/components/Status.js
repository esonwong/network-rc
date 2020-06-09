import React from 'react'
import {
  Form,
  Switch,
  Dropdown,
  Button,
  Tag,
} from "antd";
import {
  HomeOutlined,
  FullscreenOutlined,
  ApiOutlined,
  BulbOutlined,
  FullscreenExitOutlined,
  ThunderboltOutlined,
  PoweroffOutlined,
  AudioOutlined
} from "@ant-design/icons"
import { Location } from "@reach/router";
import Nav from './Nav';

export default function Status({
  piPowerOff,
  wsConnected,
  connect,
  disconnect,
  powerEnabled,
  changePower,
  lightEnabled,
  changeLight,
  localMicrphoneEnabled,
  webrtc,
  delay,
  isFullscreen,
  changeLocalMicrphone,
  disabled
}) {
  return (
    <Form layout="inline" className="app-status" size="small">
      <Form.Item>
        <Location>
          {({ navigate }) => (
            <Dropdown.Button
              overlay={<Nav piPowerOff={piPowerOff} />}
              onClick={() => navigate(`${process.env.PUBLIC_URL}/`)}
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



      {webrtc && webrtc.localStream &&
        <Form.Item>
          <Switch
            checked={localMicrphoneEnabled}
            onChange={changeLocalMicrphone}
            checkedChildren={<AudioOutlined />}
            unCheckedChildren={<AudioOutlined />}
          />
        </Form.Item>
      }

      {document.body.requestFullscreen && (
        <Form.Item>
          <Button
            type="primary"
            shape="circle"
            icon={
              isFullscreen ? (

                <FullscreenExitOutlined />
              ) : (
                  <FullscreenOutlined />
                )
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
      {wsConnected &&
        <Form.Item>
          <Button
            type="danger"
            shape="circle"
            icon={
              <PoweroffOutlined />
            }
            onClick={piPowerOff}
          ></Button>
        </Form.Item>}
      {wsConnected && delay && (
        <Form.Item>
          <Tag color={delay > 80 ? "red" : "green"}>ping:{delay.toFixed(0)}</Tag>
        </Form.Item>)}

    </Form>
  )
}
