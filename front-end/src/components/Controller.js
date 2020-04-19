import React, { Component, Fragment } from "react";
import { Form, Button, Switch, Slider, Popover, message } from "antd";
import { SlidersOutlined } from "@ant-design/icons";
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

let curentOrientation;
let isSupportedOrientaion = false;
const deviceorientation = (e) => {
  const { alpha, beta, gamma } = e;
  curentOrientation = { alpha, beta, gamma };
  if (alpha || isSupportedOrientaion) {
    isSupportedOrientaion = true;
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
      isShowButton: true,
    };
  }

  componentDidMount() {
    window.addEventListener("deviceorientation", this.deviceorientation);
    window.addEventListener("gamepadconnected", function (e) {
      const {
        gamepad: { index, id, buttons, axes },
      } = e;
      message.success(`控制器已连接于 ${index} 位: ${id}。`);
      message.success(`${buttons.length} 个按钮, ${axes.length} 个坐标方向。`);
    });
    window.addEventListener("gamepaddisconnected", function (e) {
      const {
        gamepad: { index, id },
      } = e;
      message.success(`控制器位${id}-${index}已断开。`);
    });
    this.gamePadsLoop();
  }

  gamePadsLoop = () => {
    const {
      fixedController: { speed, direction },
    } = this;
    this.gamePadsTime = setInterval(() => {
      var gamepadList = navigator.getGamepads
        ? navigator.getGamepads()
        : navigator.webkitGetGamepads
        ? navigator.webkitGetGamepads
        : [];
      if (!gamepadList[0]) {
        return;
      }
      const { axes, buttons, mapping } = gamepadList[0];
      const [x, y] = axes;
      speed(-y);
      direction(-x);
      // message.info(JSON.stringify(axes));
      // message.info(JSON.stringify(buttons));
      // message.info(JSON.stringify(mapping));
    }, 50);
  };

  componentWillUnmount() {
    window.removeEventListener(
      "deviceorientation",
      this.handleSetZeroOrientation
    );
  }
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
    controller.direction((bateDegree / 30) * (directionReverse ? -1 : 1));
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
            舵机感应校准
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
      fixedController: { speed, direction },
    } = this;
    const { forwardPower, backwardPower, isShowButton } = this.state;
    return (
      <div className="controller">
        <Form className="controller-form" size="small" layout="inline">
          <Form.Item>
            <Popover content={fixContent} title="修正" trigger="click">
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
                style={{ display: !isSupportedOrientaion ? undefined : "none" }}
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
                style={{ display: !isSupportedOrientaion ? undefined : "none" }}
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
          <Form.Item label="虚拟按钮">
            <Switch
              checked={isShowButton}
              onChange={(isShowButton) => this.setState({ isShowButton })}
            />
          </Form.Item>
          <Form.Item label="键盘">wsad</Form.Item>
          <Form.Item label="前进油门">
            <Slider
              value={forwardPower}
              min={0}
              max={100}
              onChange={(forwardPower) => {
                this.setState({ forwardPower });
              }}
              style={{ width: "15vw" }}
            />
          </Form.Item>
          <Form.Item label="倒退油门">
            <Slider
              value={backwardPower}
              min={0}
              max={100}
              style={{ width: "15vw" }}
              onChange={(backwardPower) => {
                this.setState({ backwardPower });
              }}
            />
          </Form.Item>
        </Form>
        <Keybord controller={{ speed, direction }} />
      </div>
    );
  }
}
