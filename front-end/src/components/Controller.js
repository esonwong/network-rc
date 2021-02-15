import React, { Component } from "react";
import store from "store";
import { Form, Button, Switch, Slider, Popover, message, Input } from "antd";
import { SlidersOutlined, DragOutlined } from "@ant-design/icons";
import { AimOutlined, SendOutlined, SoundOutlined } from "@ant-design/icons";
import Keybord from "./Keyboard";
import Ai from "./Ai";
import { Router } from "@reach/router";
import ObjectDetection from "./ObjectDetection";
import { createRef } from "react";
import Microphone from "./Microphone";
import ControlUI from "./ControlUI";
import Gamepad from "./Gamepad";

let curentOrientation;
let isSupportedOrientaion = false;

const deviceorientation = (e) => {
  const { alpha, beta, gamma } = e;
  curentOrientation = { alpha, beta, gamma };
  if (alpha && !isSupportedOrientaion) {
    isSupportedOrientaion = true;
    message.info("手机横屏点击修正进行校准可开启,重力感应控制方向╰(*°▽°*)╯！");
  }
};

window.addEventListener("deviceorientation", deviceorientation);

export default class Controller extends Component {
  constructor(props) {
    super(props);
    this.ttsInput = createRef();
    this.state = {
      text: "",
      zeroOrientation: undefined,
      backwardPower: store.get("backward-power") || 50,
      forwardPower: store.get("forward-power") || 50,
      isShowButton: store.get("is-show-button") || true,
      gamepadEnabled: false,
      ttsInputVisible: false,
    };
    this.steeringStatus = [];
    debugger;
    window.addEventListener("deviceorientation", this.deviceorientation);
  }

  componentWillUnmount() {
    window.removeEventListener("deviceorientation", this.deviceorientation);
  }

  deviceorientation = ({ alpha, beta, gamma }) => {
    debugger;
    const {
      state: { isAiControlling, zeroOrientation },
      props: {
        serverConfig: { channelList = [], specialChannel = {} } = {},
        changeChannel,
      },
    } = this;
    const directionChannel = channelList.find(
      ({ id }) => id === specialChannel.direction
    );
    if (!directionChannel) return;
    if (!zeroOrientation) return;
    if (isAiControlling) return;
    const { pin } = directionChannel;
    const { beta: baseBeta } = zeroOrientation;
    let bateDegree = beta - baseBeta;
    bateDegree = bateDegree < -30 ? -30 : bateDegree;
    bateDegree = bateDegree > 30 ? 30 : bateDegree;
    changeChannel({ pin, value: bateDegree / 30 });
  };

  onControl() {}

  fixContent = () => {
    const {
      serverConfig: { channelList = [], specialChannel },
      saveServerConfig,
      changeChannel,
    } = this.props;

    const direction = channelList.find(
      ({ id }) => id === specialChannel.direction
    );

    return (
      <Form>
        <Form.Item
          style={{ display: isSupportedOrientaion ? undefined : "none" }}
        >
          <Button
            type="danger"
            onClick={() => {
              this.setState({ zeroOrientation: { ...curentOrientation } });
            }}
            icon={<AimOutlined />}
          >
            舵机重力感应校准
          </Button>
          &nbsp;
          <Button
            onClick={() => {
              this.setState({ zeroOrientation: undefined });
            }}
          >
            关闭重力感应
          </Button>
        </Form.Item>

        {direction && (
          <Form.Item label="舵机微调">
            <Slider
              defaultValue={direction.valueReset * 50 + 50}
              min={0}
              max={100}
              included={false}
              onChange={(v) => {
                direction.valueReset = v / 50 - 1;
                saveServerConfig({
                  channelList,
                });
              }}
              style={{ width: "50vw" }}
            />
          </Form.Item>
        )}
      </Form>
    );
  };

  render() {
    const {
      fixContent,
      ttsInput,
      props: {
        action,
        cameraEnabled,
        videoEl,
        onTTS,
        ttsPlaying,
        setting,
        playAudio,
        serverConfig,
        changeChannel,
        editabled,
        cameraList,
        channelStatus,
      },
    } = this;
    const {
      forwardPower,
      backwardPower,
      isShowButton,
      ttsInputVisible,
      text,
    } = this.state;
    return (
      <div className="controller">
        <Router className="controller-router">
          <Ai
            path="ai/learn/*"
            canvasRef={videoEl}
            cameraEnabled={cameraEnabled}
            action={action}
            onAi={(isAiControlling) => this.setState({ isAiControlling })}
          />
          <ObjectDetection
            path="ai/coco-ssd/*"
            videoEl={videoEl}
            cameraEnabled={cameraEnabled}
            action={action}
            onAi={(isAiControlling) => this.setState({ isAiControlling })}
          />
        </Router>
        <Form className="controller-form" size="small" layout="inline">
          <Form.Item>
            <Popover
              content={fixContent}
              title="修正"
              trigger="click"
              placement="topLeft"
            >
              <Button icon={<SlidersOutlined />}>修正</Button>
            </Popover>
          </Form.Item>
          <Form.Item>
            <Popover
              placement="topLeft"
              content={
                <Slider
                  value={forwardPower}
                  min={0}
                  max={100}
                  onChange={(forwardPower) => {
                    this.setState({ forwardPower });
                    store.set("forward-power", forwardPower);
                  }}
                  arrowPointAtCenter
                  style={{ width: "30vw" }}
                />
              }
            >
              <Button shape="round">前进油门:{forwardPower}</Button>
            </Popover>
          </Form.Item>
          <Form.Item>
            <Popover
              placement="topLeft"
              content={
                <Slider
                  value={backwardPower}
                  min={0}
                  max={100}
                  style={{ width: "30vw" }}
                  onChange={(backwardPower) => {
                    this.setState({ backwardPower });
                    store.set("backward-power", backwardPower);
                  }}
                />
              }
            >
              <Button shape="round">倒退油门:{backwardPower}</Button>
            </Popover>
          </Form.Item>
          <Form.Item>
            <Switch
              checked={isShowButton}
              onChange={(isShowButton) => {
                store.set("is-show-button", isShowButton);
                this.setState({ isShowButton });
              }}
              checkedChildren={<DragOutlined />}
              unCheckedChildren={<DragOutlined />}
            />
          </Form.Item>
          <Form.Item>
            <Gamepad
              changeChannel={changeChannel}
              channelList={serverConfig.channelList}
              channelStatus={channelStatus}
            />
          </Form.Item>
          <Form.Item>
            <Keybord
              playAudio={playAudio}
              channelStatus={channelStatus}
              channelList={serverConfig.channelList}
              changeChannel={changeChannel}
              serverConfig={serverConfig}
              onEnter={() => {
                this.setState({ ttsInputVisible: true });
                setTimeout(() => {
                  ttsInput.current && ttsInput.current.focus();
                }, 200);
              }}
            />
          </Form.Item>
          <Form.Item>
            <Popover
              arrowPointAtCenter
              trigger="click"
              placement="topRight"
              visible={ttsInputVisible}
              onVisibleChange={(ttsInputVisible) => {
                this.setState({ ttsInputVisible });
                setTimeout(() => {
                  ttsInput.current && ttsInput.current.focus();
                }, 200);
              }}
              content={
                <form>
                  <Input.Search
                    ref={ttsInput}
                    name="tts"
                    style={{ width: "60vw" }}
                    placeholder="发送语音"
                    enterButton="发送"
                    value={text}
                    onChange={(e) => this.setState({ text: e.target.value })}
                    onSearch={(text) => {
                      onTTS(text);
                      this.setState({ text: "" });
                    }}
                    loading={ttsPlaying}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === "Escape") {
                        this.setState({ ttsInputVisible: false });
                      }
                    }}
                  />
                </form>
              }
            >
              <Button shape="round">
                <SendOutlined />
              </Button>
            </Popover>
          </Form.Item>

          <Form.Item>
            <Button
              shape="round"
              onClick={() => playAudio({ path: serverConfig.audio1 })}
            >
              <SoundOutlined />
            </Button>
          </Form.Item>

          <Form.Item>
            <Microphone
              url={`${
                window.location.protocol === "https:" ? "wss://" : "ws://"
              }${setting.wsAddress}/audio`}
            />
          </Form.Item>
        </Form>
        <ControlUI
          channelStatus={channelStatus}
          isShowButton={isShowButton}
          uiComponentList={serverConfig.uiComponentList}
          channelList={serverConfig.channelList}
          changeChannel={changeChannel}
          editabled={editabled}
          cameraList={cameraList}
          setting={setting}
        />
      </div>
    );
  }
}
