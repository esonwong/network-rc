import React, { Component } from "react";
import { Form, Button, Switch, Slider } from "antd";
import {
  AimOutlined,
  DownOutlined,
  UpOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import store from "store";
import Keybord from "../Keyboard";

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
      directionReverse: store.get("directionReverse") || true,
      backwardPower: 50,
      forwardPower: 50,
    };
  }

  componentDidMount() {
    window.addEventListener("deviceorientation", this.deviceorientation);
  }

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

  render() {
    const { directionReverse, controller } = this.props;
    const { forwardPower, backwardPower } = this.state;
    return (
      <div className="controller">
        <Form className="controller-form" size="small" layout="inline">
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
              舵机校准
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
          <Button
            className="left-button"
            shape="circle"
            size="large"
            type="primary"
            onTouchStart={() => {
              controller.direction(1);
            }}
            onTouchEnd={() => {
              controller.direction(0);
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
              controller.direction(-1);
            }}
            onTouchEnd={() => {
              controller.direction(0);
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
              controller.speed((1 * forwardPower) / 100);
            }}
            onTouchEnd={() => {
              controller.speed(0);
            }}
            icon={<UpOutlined />}
          ></Button>

          <Button
            className="backward-button"
            shape="circle"
            size="large"
            type="primary"
            onTouchStart={() => {
              controller.speed((-1 * backwardPower) / 100);
            }}
            onTouchEnd={() => {
              controller.speed(0);
            }}
            icon={<DownOutlined />}
          ></Button>

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
        <Keybord
          controller={controller}
          backwardPower={backwardPower}
          forwardPower={forwardPower}
        />
      </div>
    );
  }
}
