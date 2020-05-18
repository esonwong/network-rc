import React, { Component, Fragment } from "react";
import { Form, Button, Switch, Slider, Popover, message, Tag } from "antd";
import { SlidersOutlined, DragOutlined } from "@ant-design/icons";
import {
  AimOutlined,
  DownOutlined,
  UpOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import store from "store";
import Keybord from "../Keyboard";
import { vibrate } from "../unit";
import Icon from "./Icon";
import Ai from "./Ai";
import mobile from "is-mobile";
import { Router } from "@reach/router";
import ObjectDetection from "./ObjectDetection";

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
    this.state = {
      zeroOrientation: undefined,
      directionReverse: store.get("directionReverse") || false,
      speedReverse: store.get("speedReverse") || false,
      backwardPower: 50,
      forwardPower: 50,
      directionFix: store.get("directionFix") || 0,
      isShowButton: mobile(),
      gamepadEnabled: false,
    };
  }

  componentDidMount() {
    window.addEventListener("deviceorientation", this.deviceorientation);
    window.addEventListener("gamepadconnected", this.gamepadConnected);
    window.addEventListener("gamepaddisconnected", this.gamepadDisconnected);
    window.addEventListener("gamepadpress", this.gamepadPress);
    window.addEventListener("gamepadaxis", this.gamepadAxis);
    this.gamePadsLoop();
  }

  componentWillUnmount() {
    clearInterval(this.gamePadsTime);
    window.removeEventListener("deviceorientation", this.deviceorientation);
    window.removeEventListener("gamepadconnected", this.gamepadConnected);
    window.removeEventListener("gamepaddisconnected", this.gamepadDisconnected);
    window.removeEventListener("gamepadpress", this.gamepadPress);
    window.removeEventListener("gamepadaxis", this.gamepadAxis);
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
    let { forwardPower } = this.state;
    const {
      fixedController: { speed, direction },
    } = this;
    if (index === 1 || index === 13 || index === 6) {
      speed(value * -1);
    }
    if (index === 0 || index === 12 || index === 7) {
      speed(value);
    }
    if (index === 14) {
      direction(value * -1);
    }
    if (index === 15) {
      direction(value);
    }
    if (index === 10 && value === 1) {
      changeLight(!lightEnabled);
    }
    if (index === 9 && value === 1) {
      changeCamera(!cameraEnabled);
    }

    if (index === 11 && value === 1) {
      changePower(!powerEnabled);
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

  gamepadAxis = ({ detail: { index, value } }) => {
    const {
      fixedController: { speed, direction },
    } = this;
    if (index === 0) {
      direction(-value);
    }
    if (index === 3) {
      speed(-value);
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
        state: { forwardPower, backwardPower, speedReverse },
      } = this;
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
        state: { directionReverse, directionFix },
      } = this;
      direction(v * (directionReverse ? -1 : 1) + directionFix);
    },
    changeCamera: (v) => this.props.controller.changeCamera(v),
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
      props: { action, cameraEnabled, videoSize, videoEl },
    } = this;
    const {
      gamepadEnabled,
      forwardPower,
      backwardPower,
      isShowButton,
      zeroOrientation
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
            <Popover content={fixContent} title="修正" trigger="click" placement="topLeft">
              <Button icon={<SlidersOutlined />}>修正</Button>
            </Popover>
          </Form.Item>
          {isShowButton && (
            <Fragment>
              <Button
                className="left-button"
                shape="circle"
                size="large"
                type="primary"
                onTouchStart={() => {
                  direction(1);
                  vibrate(50);
                }}
                onTouchEnd={() => {
                  direction(0);
                }}
                icon={<LeftOutlined />}
                style={{ display: !zeroOrientation ? undefined : "none" }}
              ></Button>
              <Button
                className="right-button"
                shape="circle"
                size="large"
                type="primary"
                onTouchStart={() => {
                  direction(-1);
                  vibrate(50);
                }}
                onTouchEnd={() => {
                  direction(0);
                }}
                icon={<RightOutlined />}
                style={{ display: !zeroOrientation ? undefined : "none" }}
              ></Button>
              <Button
                className="forward-button"
                shape="circle"
                size="large"
                type="primary"
                onTouchStart={() => {
                  speed(1);
                  vibrate(300);
                }}
                onTouchEnd={() => {
                  speed(0);
                }}
                icon={<UpOutlined />}
              ></Button>
              <Button
                className="backward-button"
                shape="circle"
                size="large"
                type="primary"
                onTouchStart={() => {
                  speed(-1);
                  vibrate([100, 50, 100]);
                }}
                onTouchEnd={() => {
                  speed(0);
                }}
                icon={<DownOutlined />}
              ></Button>
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
            <Tag>键盘:wsad</Tag>
          </Form.Item>
        </Form>
        <Keybord controller={{ speed, direction }} />

      </div>
    );
  }
}
