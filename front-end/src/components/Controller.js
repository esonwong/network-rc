import React, { Component, Fragment } from "react";
import { Form, Button, Switch, Slider, Popover, message, Input } from "antd";
import { SlidersOutlined, DragOutlined } from "@ant-design/icons";
import {
  AimOutlined,
  // DownOutlined,
  // UpOutlined,
  // LeftOutlined,
  // RightOutlined,
  NotificationOutlined
} from "@ant-design/icons";
import store from "store";
import Keybord from "../Keyboard";
// import { vibrate } from "../unit";
import Icon from "./Icon";
import Ai from "./Ai";
import mobile from "is-mobile";
import { Router } from "@reach/router";
import ObjectDetection from "./ObjectDetection";
import NSlider from "./Slider";
import { createRef } from "react";

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
      zeroOrientation: undefined,
      directionReverse: store.get("directionReverse") || false,
      speedReverse: store.get("speedReverse") || false,
      backwardPower: 50,
      forwardPower: 50,
      directionFix: store.get("directionFix") || 0,
      isShowButton: mobile(),
      gamepadEnabled: false,
      ttsInputVisible: false,
      fixedAction: {
        direction: 0,
        speed: 0,
        steering: []
      },
    };
  }

  componentDidMount() {
    window.addEventListener("deviceorientation", this.deviceorientation);
    window.addEventListener("gamepadconnected", this.gamepadConnected);
    window.addEventListener("gamepaddisconnected", this.gamepadDisconnected);
    window.addEventListener("gamepadpress", this.gamepadPress);
    window.addEventListener("gamepadaxis", this.gamepadAxis);
    window.addEventListener("gamepadaxisLoop", this.gamepadaxisLoop);
    this.gamePadsLoop();
  }

  componentWillUnmount() {
    clearInterval(this.gamePadsTime);
    window.removeEventListener("deviceorientation", this.deviceorientation);
    window.removeEventListener("gamepadconnected", this.gamepadConnected);
    window.removeEventListener("gamepaddisconnected", this.gamepadDisconnected);
    window.removeEventListener("gamepadpress", this.gamepadPress);
    window.removeEventListener("gamepadaxis", this.gamepadAxis);
    window.removeEventListener("gamepadaxisLoop", this.gamepadaxisLoop);
    window.removeEventListener(
      "deviceorientation",
      this.handleSetZeroOrientation
    );
  }

  gamepadConnected = (e) => {
    const {
      gamepad: { index, id },
    } = e;
    message.success(`控制器已连接于 ${index} 位: ${id}。`);
    this.setState({ gamepadEnabled: true });
  };
  gamepadDisconnected(e) {
    const {
      gamepad: { index, id },
    } = e;
    message.error(`控制器位${id}-${index}已断开。`);
  }

  gamepadPress = ({ detail: { index, value } }) => {
    const {
      lightEnabled,
      cameraEnabled,
      powerEnabled,
      controller: { changeLight, changeCamera, changePower },
    } = this.props;
    let { forwardPower, zeroOrientation } = this.state;
    const {
      fixedController: { speed, direction, steering },
    } = this;
    if (index === 0 && value === 1) {
      changePower(!powerEnabled);
    }
    if (index === 1 && value === 1) {
      changeLight(!lightEnabled);
    }
    if (index === 13 || index === 6) {
      speed(value * -1);
    }
    if (index === 12 || index === 7) {
      speed(value);
    }
    if (index === 14) {
      direction(value * -1);
    }
    if (index === 15) {
      direction(value);
    }
    if (index === 10 && value === 1) {
      message[!zeroOrientation ? "success" : "info"](zeroOrientation ? "关闭重力感应控制!" : "重力感应已校准!");
      this.setState({ zeroOrientation: zeroOrientation ? undefined : { ...curentOrientation } })
    }
    if (index === 9 && value === 1) {
      changeCamera(!cameraEnabled);
    }

    if (index === 11 && value === 1) {
      steering(0, 0);
      steering(1, 0)
    }

    if ((index === 4 || index === 2) && value === 1) {
      forwardPower -= 5;
      if (forwardPower < 0) forwardPower = 0;
      this.setState({ forwardPower });
    }
    if ((index === 3 || index === 5) && value === 1) {
      forwardPower += 5;
      if (forwardPower > 100) forwardPower = 100;
      this.setState({ forwardPower });
    }
  };

  gamepadaxisLoop = ({ detail: { index, value } }) => {
    const {
      fixedController: { steering },
      state: {
        fixedAction: {
          steering: [s0 = 0, s1 = 0]
        }
      }
    } = this;
    if (index === 2 && Math.abs(value) > 0.1) {
      steering(0, s0 - value / 5);
    }
    if (index === 3 && Math.abs(value) > 0.1) {
      steering(1, s1 + value / 5);
    }
  }

  gamepadAxis = ({ detail: { index, value } }) => {
    const {
      fixedController: { direction },
    } = this;
    if (index === 0) {
      direction(-value);
    }
  };

  gamePadsLoop = () => {
    const buttonsStatus = {},
      axesStatus = {};
    this.gamePadsTime = setInterval(() => {
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
        if (!gamepad) continue;
        const { axes, buttons, connected } = gamepad;
        if (!connected) continue;
        buttons.forEach((status, index) => {
          if (!buttonsStatus[`${gamePadIndex}-${index}`]) {
            buttonsStatus[`${gamePadIndex}-${index}`] = status;
            return;
          }
          if (
            buttonsStatus[`${gamePadIndex}-${index}`].value !== status.value
          ) {
            window.dispatchEvent(
              new CustomEvent("gamepadpress", {
                detail: { index, value: status.value },
              })
            );
          }
          buttonsStatus[`${gamePadIndex}-${index}`] = status;
        });
        axes.forEach((value, index) => {
          if (!axesStatus[`${gamePadIndex}-${index}`]) {
            axesStatus[`${gamePadIndex}-${index}`] = { value };
            return;
          }
          if (axesStatus[`${gamePadIndex}-${index}`].value !== value) {
            window.dispatchEvent(
              new CustomEvent("gamepadaxis", {
                detail: { index, value },
              })
            );
          }
          window.dispatchEvent(
            new CustomEvent("gamepadaxisLoop", {
              detail: { index, value },
            })
          );
          axesStatus[`${gamePadIndex}-${index}`] = { value };
        });
      }
    }, 50);
  };

  deviceorientation = ({ alpha, beta, gamma }) => {
    const {
      props: { controller },
      state: { directionReverse, isAiControlling, zeroOrientation },
    } = this;
    if (!zeroOrientation) return;
    if (isAiControlling) return;
    const { beta: baseBeta } = zeroOrientation;
    let bateDegree = beta - baseBeta;
    bateDegree = bateDegree < -30 ? -30 : bateDegree;
    bateDegree = bateDegree > 30 ? 30 : bateDegree;
    controller.direction((bateDegree / 30) * (directionReverse ? 1 : -1));
  };

  fixedController = {
    speed: (v) => {
      const {
        props: {
          controller: { speed },
        },
        state: { forwardPower, backwardPower, speedReverse, fixedAction },
      } = this;
      this.setState({ fixedAction: { ...fixedAction, speed: v } });
      speed(
        v *
        (speedReverse ? -1 : 1) *
        ((v > 0 ? forwardPower : backwardPower) / 100)
      );
    },
    direction: (v) => {
      const {
        props: {
          controller: { direction },
        },
        state: { directionReverse, directionFix, fixedAction },
      } = this;
      this.setState({ fixedAction: { ...fixedAction, direction: v } });
      direction(v * (directionReverse ? -1 : 1) + directionFix);
    },

    changeCamera: (v) => this.props.controller.changeCamera(v),
    steering: (index, v) => {
      const { fixedAction } = this.state;
      if (v > 2) v = 2;
      if (v < -2) v = -2;
      fixedAction.steering[index] = v;
      this.setState({ fixedAction });
      this.props.controller.changeSteering(index, v)
    },
  };

  fixContent = () => {
    const { directionReverse, speedReverse, directionFix } = this.state;
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
        <Form.Item label="舵机反向">
          <Switch
            checked={directionReverse}
            onChange={(v) => {
              this.setState({
                directionReverse: v,
              });
              store.set("directionReverse", v);
            }}
          />
        </Form.Item>
        <Form.Item label="油门反向">
          <Switch
            checked={speedReverse}
            onChange={(v) => {
              this.setState({
                speedReverse: v,
              });
              store.set("speedReverse", v);
            }}
          />
        </Form.Item>
        <Form.Item label="舵机微调">
          <Slider
            value={directionFix * 50 + 50}
            min={0}
            max={100}
            included={false}
            onChange={(v) => {
              const directionFix = v / 50 - 1;
              store.set("directionFix", directionFix);
              this.setState({ directionFix }, () => {
                this.fixedController.direction(0);
              });
            }}
            style={{ width: "50vw" }}
          />
        </Form.Item>
      </Form>
    );
  };

  render() {
    const {
      fixContent,
      fixedController,
      ttsInput,
      props: { action, cameraEnabled, videoSize, videoEl, onTTS, ttsPlaying },
    } = this;
    const {
      gamepadEnabled,
      forwardPower,
      backwardPower,
      isShowButton,
      zeroOrientation,
      fixedAction,
      ttsInputVisible
    } = this.state;
    const { speed, direction } = fixedController;
    return (
      <div className="controller">
        <Router className="controller-router">
          <Ai
            path="ai/learn/*"
            canvasRef={videoEl}
            cameraEnabled={cameraEnabled}
            action={action}
            controller={fixedController}
            onAi={(isAiControlling) => this.setState({ isAiControlling })}
          />
          <ObjectDetection
            path="ai/coco-ssd/*"
            videoEl={videoEl}
            cameraEnabled={cameraEnabled}
            action={action}
            controller={fixedController}
            onAi={(isAiControlling) => this.setState({ isAiControlling })}
            videoSize={videoSize}
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
          {isShowButton && (
            <Fragment>
              <NSlider
                value={fixedAction.direction}
                onChange={(v) => direction(v)}
                className="direction-slider"
                style={{ display: !zeroOrientation ? undefined : "none" }}
              />
              <NSlider
                vertical
                value={fixedAction.speed}
                onChange={(v) => speed(v)}
                className="speed-slider"
              // style={{ display: !zeroOrientation ? undefined : "none" }}
              />
            </Fragment>
          )}
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
              onChange={(isShowButton) => this.setState({ isShowButton })}
              checkedChildren={<DragOutlined />}
              unCheckedChildren={<DragOutlined />}
            />
          </Form.Item>
          <Form.Item>
            <Switch
              checked={gamepadEnabled}
              onChange={(gamepadEnabled) => {
                if (gamepadEnabled) {
                  this.gamePadsLoop();
                } else {
                  clearInterval(this.gamePadsTime);
                }
                this.setState({ gamepadEnabled });
              }}
              unCheckedChildren={<Icon type="icon-game-" />}
              checkedChildren={<Icon type="icon-game-" />}
            />
          </Form.Item>
          <Form.Item>
            <Popover
              placement="topLeft"
              content={
                <p>移动：wsad <br /> 云台：ikjl,p</p>
              }
            >
              <Button shape="round">键盘</Button>
            </Popover>
          </Form.Item>
          <Form.Item>
            <Popover
              arrowPointAtCenter
              trigger="click"
              placement="topRight"
              visible={ttsInputVisible}
              onVisibleChange={ttsInputVisible => {
                this.setState({ ttsInputVisible });
                setTimeout(() => {
                  ttsInput.current && ttsInput.current.focus();
                }, 200)
              }}
              content={
                <form>
                  <Input.Search
                    ref={ttsInput}
                    name="tts"
                    style={{ width: "60vw" }}
                    placeholder="发送语音"
                    enterButton="发送"
                    onSearch={onTTS}
                    loading={ttsPlaying}
                    onKeyDown={({ key }) => {
                      if (key === "Escape") {
                        this.setState({ ttsInputVisible: false })
                      }
                    }}
                  />
                </form>
              }
            >
              <Button shape="round">
                <NotificationOutlined />
              </Button>
            </Popover>
          </Form.Item>
        </Form>
        <Keybord controller={fixedController} onEnter={() => {
          this.setState({ ttsInputVisible: true })
          setTimeout(() => {
            ttsInput.current && ttsInput.current.focus();
          }, 200)
        }} />
      </div>
    );
  }
}
