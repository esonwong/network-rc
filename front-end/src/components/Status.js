import React from 'react'
import {
  Form,
  Switch,
  Dropdown,
  Button,
  Popover,
  Slider,
  Tag,
  Radio
} from "antd";
import {
  HomeOutlined,
  ExpandOutlined,
  FullscreenOutlined,
  ApiOutlined,
  VideoCameraOutlined,
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
  protocol,
  disconnect,
  powerEnabled,
  changePower,
  cameraEnabled,
  changeCamera,
  onChangeVideoSize,
  lightEnabled,
  changeLight,
  localMicrphoneEnabled,
  webrtc,
  videoSize,
  delay,
  isFullscreen,
  changeLocalMicrphone,
  cameraLoading,
  onChangeProtocol,
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

      <Form.Item>
        <Switch
          checked={cameraEnabled}
          onChange={changeCamera}
          checkedChildren={<VideoCameraOutlined />}
          unCheckedChildren={<VideoCameraOutlined />}
          loading={cameraLoading}
          disabled={disabled}
        />
      </Form.Item>

      <Form.Item>
        <Popover
          placement="bottomRight"
          content={
            <Radio.Group value={protocol} onChange={({ target: { value } }) => onChangeProtocol(value)}>
              <Radio.Button value="webrtc">webrtc</Radio.Button>
              <Radio.Button value="websocket">websocket</Radio.Button>
            </Radio.Group>
          }
        >
          <Button shape="round"
            disabled={disabled}
          >
            {protocol}
          </Button>
        </Popover>
      </Form.Item>

      {cameraEnabled && (
        <Form.Item>
          <Popover
            placement="bottomRight"
            content={
              <Slider
                defaultValue={videoSize}
                step={0.1}
                tipFormatter={(v) => v * 2}
                onAfterChange={onChangeVideoSize}
                style={{ width: "30vw" }}
                marks={{ 0: 0, 50: 100, 100: 200 }}
              />
            }
          >
            <Button shape="round">
              <ExpandOutlined />
              {/* {(videoSize * 2).toFixed(1)}% */}
                </Button>
          </Popover>
        </Form.Item>
      )}

      {/* <Form.Item>
            <Button style={{ width: "6em" }}>
              舵机:{action.direction.toFixed(2)}
            </Button>
          </Form.Item>
          <Form.Item>
            <Button style={{ width: "6em" }}>
              电调:{action.speed.toFixed(2)}
            </Button>
          </Form.Item> */}



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
