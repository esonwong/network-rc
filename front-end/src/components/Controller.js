import React, { Component } from "react";
import store from "store";
import { Form, Button, Switch, Slider, Popover, Input } from "antd";
import { SlidersOutlined, DragOutlined } from "@ant-design/icons";
import { SendOutlined, SoundOutlined } from "@ant-design/icons";
import Keybord from "./Keyboard";
import Ai from "./Ai";
import { Router } from "@reach/router";
import ObjectDetection from "./ObjectDetection";
import { createRef } from "react";
import Microphone from "./Microphone";
import ControlUI from "./ControlUI";
import Gamepad from "./Gamepad";
import Orientation from "./Orientation";

export default class Controller extends Component {
  constructor(props) {
    super(props);
    this.ttsInput = createRef();
    this.state = {
      text: "",
      zeroOrientation: undefined,
      isShowButton: store.get("is-show-button") || true,
      ttsInputVisible: false,
    };
    this.steeringStatus = [];
  }

  onControl() {}

  fixContent = () => {
    const {
      serverConfig: { channelList = [], specialChannel = {} },
      saveServerConfig,
    } = this.props;

    const direction = channelList.find(
      ({ id }) => id === specialChannel.direction
    );

    return (
      <Form>
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
        saveServerConfig,
        isFullscreen,
      },
    } = this;
    const { isShowButton, ttsInputVisible, text } = this.state;
    const { channelList = [], specialChannel = {} } = serverConfig;
    const speedChannel = channelList.find(
      ({ id }) => id === specialChannel.speed
    );

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
        {!isFullscreen && (
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
            {speedChannel && (
              <>
                <Form.Item>
                  <Popover
                    placement="topLeft"
                    content={
                      <Slider
                        defaultValue={speedChannel.valuePostive * 100}
                        min={0}
                        max={100}
                        onChange={(v) => {
                          speedChannel.valuePostive = v / 100;
                          saveServerConfig({
                            channelList,
                          });
                        }}
                        arrowPointAtCenter
                        style={{ width: "30vw" }}
                      />
                    }
                  >
                    <Button shape="round">
                      前进:{Math.round(speedChannel.valuePostive * 100)}
                    </Button>
                  </Popover>
                </Form.Item>
                <Form.Item>
                  <Popover
                    placement="topLeft"
                    content={
                      <Slider
                        defaultValue={speedChannel.valueNegative * -100}
                        min={0}
                        max={100}
                        style={{ width: "30vw" }}
                        onChange={(v) => {
                          speedChannel.valueNegative = (v / 100) * -1;
                          saveServerConfig({
                            channelList,
                          });
                        }}
                      />
                    }
                  >
                    <Button shape="round">
                      倒退:{Math.round(speedChannel.valueNegative * -100)}
                    </Button>
                  </Popover>
                </Form.Item>
              </>
            )}
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
                playAudio={playAudio}
                serverConfig={serverConfig}
              />
            </Form.Item>

            <Form.Item>
              <Orientation
                changeChannel={changeChannel}
                channelStatus={channelStatus}
                serverConfig={serverConfig}
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
                url={
                  setting.host &&
                  `${
                    window.location.protocol === "https:" ? "wss://" : "ws://"
                  }${setting.host}/audio`
                }
              />
            </Form.Item>
          </Form>
        )}
        <ControlUI
          channelStatus={channelStatus}
          isShowButton={isShowButton}
          uiComponentList={serverConfig.uiComponentList}
          channelList={serverConfig.channelList}
          changeChannel={changeChannel}
          editabled={editabled}
          cameraList={cameraList}
          setting={setting}
          isFullscreen={isFullscreen}
        />
      </div>
    );
  }
}
