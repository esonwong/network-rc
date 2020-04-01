import React, { Component } from "react";
import store from "store";

import { InputNumber, Form, Switch, Input, Button, Slider, Tabs } from "antd";
import "./App.css";

const { TabPane } = Tabs;
let current;
window.addEventListener("deviceorientation", event => {
  const { alpha, beta, gamma } = event;
  current = { alpha, beta, gamma };
});

const layout = {
  labelCol: {
    span: 4
  },
  wrapperCol: {
    span: 16
  }
};

const tailLayout = {
  wrapperCol: { offset: 4, span: 16 }
};

export default class App extends Component {
  constructor(props) {
    super(props);
    this.appRef = React.createRef();
    this.state = {
      hold: false,
      speed: 0,
      direction: 0,
      base: {
        alpha: undefined,
        beta: undefined,
        gamma: undefined
      },
      speedMaxRate: store.get("speedMaxRate") || 80,
      speedReverseMaxRate: store.get("speedReverseMaxRate") || 70,
      speedZeroRate: store.get("speedZeroRate") || 75,
      speedRate: 0,
      directionReverse: store.get("directionReverse") || true,
      wsConnected: false,
      wsAddress: store.get("wsAddress")
    };
  }

  componentDidMount() {
    const {
      deviceorientation,
      keyboardBind,
      connectWs,
      state: { wsAddress }
    } = this;
    window.addEventListener(
      "deviceorientation",
      event => {
        deviceorientation();
      },
      false
    );
    keyboardBind();
    connectWs({ wsAddress });
  }

  deviceorientation = () => {
    const {
      changeSpeed,
      changeDirection,
      state: {
        hold,
        base: { gamma: baseGamma, beta: baseBeta },
        directionReverse,
        speedZeroRate,
        speedMaxRate,
        speedReverseMaxRate
      }
    } = this;
    let bateDegree = current.beta - baseBeta;
    bateDegree = bateDegree < -30 ? -30 : bateDegree;
    bateDegree = bateDegree > 30 ? 30 : bateDegree;
    const directionRate =
      (directionReverse ? -bateDegree / 30 : bateDegree / 30) * 5 + 7.5;
    changeDirection(directionRate);

    if (!hold) return;
    let gamaDegree = current.gamma - baseGamma;
    gamaDegree = gamaDegree < -30 ? -30 : gamaDegree;
    gamaDegree = gamaDegree > 30 ? 30 : gamaDegree;
    const speedRate =
      gamaDegree > 0
        ? (gamaDegree / 30) * (speedMaxRate - speedZeroRate) + speedZeroRate
        : speedZeroRate +
          (gamaDegree / 30) * (speedZeroRate - speedReverseMaxRate);
    changeSpeed(speedRate);
  };

  keyboardBind = () => {
    const { changeDirection, changeSpeed } = this;
    document.addEventListener(
      "keydown",
      event => {
        const {
          state: { wsConnected, speedMaxRate, speedReverseMaxRate }
        } = this;
        if (!wsConnected) return;
        const keyName = event.key;
        if (keyName === "w") {
          changeSpeed(speedMaxRate);
        }
        if (keyName === "s") {
          changeSpeed(speedReverseMaxRate);
        }
        if (keyName === "a") {
          changeDirection(12.5);
        }
        if (keyName === "d") {
          changeDirection(2.5);
        }
      },
      false
    );
    document.addEventListener(
      "keyup",
      event => {
        const {
          state: { wsConnected, speedZeroRate }
        } = this;
        if (!wsConnected) return;
        const keyName = event.key;
        if (keyName === "w") {
          changeSpeed(speedZeroRate);
        }
        if (keyName === "s") {
          changeSpeed(speedZeroRate);
        }
        if (keyName === "a") {
          changeDirection(7.5);
        }
        if (keyName === "d") {
          changeDirection(7.5);
        }
      },
      false
    );
  };

  connectWs = ({ wsAddress }) => {
    if (this.socket) {
      this.socket.close();
      this.socket = undefined;
    }

    this.socket = window.io(wsAddress);
    this.socket.on("connect", () => {
      this.setState({ wsConnected: true });
      this.changeZeroSpeedRate(this.state.speedZeroRate);
      store.set("wsAddress", wsAddress);
    });
    this.socket.on("disconnect", () => {
      this.setState({ wsConnected: false });
    });
  };

  disconnectWs = e => {
    e && e.preventDefault();
    this.socket.close();
  };

  handleHold = (hold = false) => {
    if (!hold) {
      this.socket.emit("speed rate", 0);
      this.socket.emit("direction rate", 0);
    }
    this.setState({
      hold,
      base: { ...current }
    });
  };

  changeZeroSpeedRate = speedZeroRate => {
    if (!this.state.wsConnected) return;
    this.socket.emit("speed zero rate", speedZeroRate);
    this.setState({ speedZeroRate });
  };

  changeSpeed = speedRate => {
    if (!this.state.wsConnected) return;
    this.socket.emit("speed rate", speedRate);
    this.setState({ speedRate });
  };

  changeDirection = directionRate => {
    if (!this.state.wsConnected) return;
    this.socket.emit("direction rate", directionRate);
    this.setState({ direction: directionRate });
  };

  render() {
    const {
      connectWs,
      disconnectWs,
      changeSpeed,
      changeDirection,
      state: {
        wsConnected,
        hold,
        directionReverse,
        direction,
        speedReverseMaxRate,
        speedMaxRate,
        speedZeroRate,
        speedRate,
        wsAddress
      }
    } = this;
    return (
      <div className="App" ref={this.appRef}>
        <Form layout="inline" className="status">
          <Form.Item label="连接状态">
            <Switch checked={wsConnected} disabled />
          </Form.Item>
          <Form.Item label="全屏">
            <Switch
              onChange={v => {
                if (v) {
                  this.appRef.current.requestFullscreen();
                } else {
                  window.document.exitFullscreen();
                }
              }}
            />
          </Form.Item>
          <Form.Item label="方向感应控制">
            <Switch checked={hold} disabled />
          </Form.Item>
          <Form.Item label="舵机">
            <Slider
              value={direction}
              min={0}
              max={100}
              onChange={changeDirection}
              style={{ width: "10vw" }}
            />
          </Form.Item>
          <Form.Item label="舵机 PWM">
            <InputNumber
              min={0}
              max={20}
              style={{ margin: "0 16px" }}
              value={direction}
              onChange={changeDirection}
            />
          </Form.Item>
          <Form.Item label="电调">
            <Slider
              value={speedRate}
              min={0}
              max={100}
              onChange={changeSpeed}
              style={{ width: "10vw" }}
            />
          </Form.Item>
          <Form.Item label="电调 PWM">
            <InputNumber
              min={0}
              max={100}
              style={{ margin: "0 16px" }}
              value={speedRate}
              onChange={changeSpeed}
            />
          </Form.Item>
        </Form>
        <Tabs tabPosition="left">
          <TabPane tab="连接" key={1}>
            <Form
              {...layout}
              onFinish={connectWs}
              initialValues={{ wsAddress }}
            >
              <br />
              <Form.Item
                label="连接地址"
                name="wsAddress"
                rules={[{ required: true, message: "请输入连接地址!" }]}
              >
                <Input />
              </Form.Item>
              <Form.Item label="电调 0 功率 PWM 空占比">
                <InputNumber
                  value={speedZeroRate}
                  min={0}
                  max={100}
                  onChange={v => {
                    this.changeZeroSpeedRate(v);
                    store.set("speedZeroRate", v);
                  }}
                />
              </Form.Item>
              <Form.Item label="电调输出最大功率 PWM 空占比">
                <InputNumber
                  value={speedMaxRate}
                  min={0}
                  max={100}
                  onChange={v => {
                    this.setState({
                      speedMaxRate: v
                    });
                    store.set("speedMaxRate", v);
                  }}
                />
              </Form.Item>
              <Form.Item label="电调反向输出最大功率 PWM 空占比">
                <InputNumber
                  value={speedReverseMaxRate}
                  min={0}
                  max={100}
                  onChange={v => {
                    this.setState({
                      speedReverseMaxRate: v
                    });
                    store.set("speedReverseMaxRate", v);
                  }}
                />
              </Form.Item>
              <Form.Item {...tailLayout}>
                {wsConnected ? (
                  <Button type="danger" onClick={disconnectWs}>
                    断开
                  </Button>
                ) : (
                  <Button type="primary" htmlType="submit">
                    连接
                  </Button>
                )}
              </Form.Item>
            </Form>
          </TabPane>
          <TabPane tab="键盘控制" key={2}>
            <Form {...layout}></Form>
          </TabPane>
          <TabPane tab="方向感应控制" key={3}>
            <Form {...layout}>
              <Form.Item label="舵机反向">
                <Switch
                  checked={directionReverse}
                  onChange={v => {
                    this.setState({
                      directionReverse: v
                    });
                  }}
                />
              </Form.Item>
              <Form.Item {...tailLayout}>
                <Button
                  type="danger"
                  onClick={() => {
                    this.setState({ base: { ...current } });
                  }}
                >
                  归零校准
                </Button>
              </Form.Item>

              <Button
                className="hold-button"
                shape="circle"
                size="large"
                type="primary"
                onTouchStart={() => {
                  this.setState({ hold: true });
                }}
                onTouchEnd={() => {
                  this.setState({ hold: false });
                  this.changeSpeed(speedZeroRate);
                  this.changeDirection(0);
                }}
              >
                启动
              </Button>
            </Form>
          </TabPane>
        </Tabs>
      </div>
    );
  }
}
