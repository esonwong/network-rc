import React, { Component } from "react";
import store from "store";
import {
  ExpandOutlined,
  AimOutlined,
  DownOutlined,
  UpOutlined
} from "@ant-design/icons";
import { InputNumber, Form, Switch, Input, Button, Slider, Tabs } from "antd";
import Keyboard from "./Keyboard";
import "./App.css";
import Player from "./Player";
import Ai from "./Ai";
import { layout, tailLayout, marks } from "./unit";

const { TabPane } = Tabs;
let current;
window.addEventListener("deviceorientation", event => {
  const { alpha, beta, gamma } = event;
  current = { alpha, beta, gamma };
});

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
      wsAddress: store.get("wsAddress"),
      playerWsAddress: store.get("playerWsAddress"),
      playerEnabled: false,
      canvasRef: undefined,
      isAiControlling: false,
      action: {
        speed: 0,
        direction: 0
      }
    };

    this.controller = {
      speed: v => {
        const {
          changeSpeed,
          state: { speedMaxRate, speedReverseMaxRate, speedZeroRate, action }
        } = this;
        action.speed = v;
        const rate =
          v > 0
            ? speedZeroRate + (speedMaxRate - speedZeroRate) * v
            : speedZeroRate + (speedZeroRate - speedReverseMaxRate) * v;
        this.setState({ action });
        changeSpeed(rate);
      },
      direction: v => {
        const {
          changeDirection,
          state: { action }
        } = this;
        action.direction = v;
        changeDirection(v * 5 + 7.5);
        this.setState({ action });
      }
    };
  }

  componentDidMount() {
    const {
      deviceorientation,
      connectWs,
      state: { wsAddress }
    } = this;
    window.addEventListener(
      "deviceorientation",
      () => {
        deviceorientation();
      },
      false
    );

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
        speedReverseMaxRate,
        isAiControlling
      }
    } = this;

    if (isAiControlling) return;
    let bateDegree = current.beta - baseBeta;
    bateDegree = bateDegree < -30 ? -30 : bateDegree;
    bateDegree = bateDegree > 30 ? 30 : bateDegree;
    const directionRate =
      (directionReverse ? -bateDegree / 30 : bateDegree / 30) * 5 + 7.5;
    changeDirection(directionRate);

    // if (!hold) return;
    // let gamaDegree = current.gamma - baseGamma;
    // gamaDegree = gamaDegree < -30 ? -30 : gamaDegree;
    // gamaDegree = gamaDegree > 30 ? 30 : gamaDegree;
    // const speedRate =
    //   gamaDegree > 0
    //     ? (gamaDegree / 30) * (speedMaxRate - speedZeroRate) + speedZeroRate
    //     : speedZeroRate +
    //       (gamaDegree / 30) * (speedZeroRate - speedReverseMaxRate);
    // changeSpeed(speedRate);
  };

  connectWs = ({ wsAddress, playerWsAddress }) => {
    if (!wsAddress) return;
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

    if (!playerWsAddress) return;
    this.setState({
      playerWsAddress
    });
    store.set("playerWsAddress", playerWsAddress);
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
      controller,
      state: {
        wsConnected,
        directionReverse,
        direction,
        speedReverseMaxRate,
        speedMaxRate,
        speedZeroRate,
        speedRate,
        wsAddress,
        playerWsAddress,
        playerEnabled,
        canvasRef,
        action
      }
    } = this;
    return (
      <div className="App" ref={this.appRef}>
        <Form layout="inline" className="status" size="small">
          <Form.Item label="连接状态">
            <Switch checked={wsConnected} disabled />
          </Form.Item>

          <Form.Item label="舵机 PWM">
            <InputNumber
              style={{ margin: "0 16px" }}
              value={direction}
              onChange={changeDirection}
            />
          </Form.Item>
          <Form.Item label="电调 PWM">
            <InputNumber
              style={{ margin: "0 16px" }}
              value={speedRate}
              onChange={changeSpeed}
            />
          </Form.Item>
          <Form.Item label="全屏">
            <Button
              type="primary"
              shape="circle"
              icon={<ExpandOutlined />}
              onClick={() => {
                this.appRef.current.requestFullscreen();
              }}
            ></Button>
          </Form.Item>
        </Form>
        <Tabs>
          <TabPane tab="控制" key={1} className="control-pane">
            <Form className="controller" size="small" layout="inline">
              <Form.Item>
                <Button
                  type="danger"
                  onClick={() => {
                    this.setState({ base: { ...current } });
                  }}
                  icon={<AimOutlined />}
                >
                  舵机校准
                </Button>
              </Form.Item>
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
            </Form>
            <Button
              className="forward-button"
              shape="circle"
              size="large"
              type="primary"
              onTouchStart={() => {
                this.setState({ hold: true });
                this.changeSpeed(speedMaxRate);
              }}
              onTouchEnd={() => {
                this.setState({ hold: false });
                this.changeSpeed(speedZeroRate);
              }}
              icon={<UpOutlined />}
            ></Button>

            <Button
              className="backward-button"
              shape="circle"
              size="large"
              type="primary"
              onTouchStart={() => {
                this.setState({ hold: true });
                this.changeSpeed(speedReverseMaxRate);
              }}
              onTouchEnd={() => {
                this.setState({ hold: false });
                this.changeSpeed(speedZeroRate);
              }}
              icon={<DownOutlined />}
            ></Button>
          </TabPane>
          <TabPane tab="键盘控制" key={2}>
            <Keyboard controller={controller} />
          </TabPane>
          <TabPane tab="设置" key="setting">
            <Form {...layout}>
              <Form.Item label="摄像头">
                <Switch
                  checked={playerEnabled}
                  onChange={playerEnabled => {
                    this.setState({ playerEnabled });
                  }}
                />
              </Form.Item>
              <Form.Item label="电调无输出 PWM 空占比">
                <Slider
                  value={speedZeroRate}
                  min={0}
                  max={100}
                  onChange={v => {
                    this.changeZeroSpeedRate(v);
                    store.set("speedZeroRate", v);
                  }}
                  included={false}
                  tooltipVisible
                  marks={marks}
                  disabled
                />
              </Form.Item>
              <Form.Item label="电调最大 PWM 空占比">
                <Slider
                  value={speedMaxRate}
                  min={speedZeroRate}
                  max={100}
                  onChange={v => {
                    this.setState({
                      speedMaxRate: v
                    });
                    store.set("speedMaxRate", v);
                  }}
                  marks={marks}
                />
              </Form.Item>
              <Form.Item label="电调反向最大 PWM 空占比">
                <Slider
                  value={speedReverseMaxRate}
                  min={0}
                  max={speedZeroRate}
                  onChange={v => {
                    this.setState({
                      speedReverseMaxRate: v
                    });
                    store.set("speedReverseMaxRate", v);
                  }}
                  marks={marks}
                />
              </Form.Item>
            </Form>
          </TabPane>
          <TabPane tab="连接" key={3}>
            <Form
              {...layout}
              onFinish={connectWs}
              initialValues={{ wsAddress, playerWsAddress }}
            >
              <br />
              <Form.Item
                label="控制连接地址"
                name="wsAddress"
                rules={[{ required: true, message: "请输入连接地址!" }]}
              >
                <Input />
              </Form.Item>
              <Form.Item label="媒体连接地址" name="playerWsAddress">
                <Input />
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
          <TabPane tab="调试" key={4}>
            <Form.Item label="电调">
              <Slider
                value={speedRate}
                min={0}
                max={100}
                onChange={changeSpeed}
              />
            </Form.Item>
            <Form.Item label="舵机">
              <Slider
                value={direction}
                min={0}
                max={100}
                onChange={changeDirection}
              />
            </Form.Item>
          </TabPane>
          <TabPane tab="Ai" key="ai">
            <Ai
              canvasRef={canvasRef}
              action={action}
              controller={controller}
              onAi={isAiControlling => this.setState({ isAiControlling })}
            />
          </TabPane>
        </Tabs>
        <Player
          disabled={!playerEnabled}
          address={playerWsAddress}
          setCanvasRef={canvasRef => {
            this.setState({ canvasRef });
          }}
        />
      </div>
    );
  }
}
