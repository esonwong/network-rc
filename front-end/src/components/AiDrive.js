import React, { Component } from "react";
import { Form, Button, Tag, InputNumber, message } from "antd";
import {
  ImportOutlined,
  CarOutlined,
  StopOutlined,
  BugOutlined,
} from "@ant-design/icons";
import { aiAction } from "./AiSample";
import { sleep } from "../unit";

export default class AiDrive extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isPredicting: false,
      actionKey: "stop",
      interval: 200,
      probability: 0,
    };
  }

  componentDidMount() {
    this.props.controller.changeCamera(true);
  }

  labelToKey(label) {
    return Object.keys(aiAction).find((key) => aiAction[key].label === label);
  }

  predict = (doSometing = () => {}) => {
    const { ai, onAi = () => {}, canvasRef } = this.props;
    onAi(true);
    this.setState({ isPredicting: true }, async () => {
      while (this.state.isPredicting) {
        const { label, probability } = await ai.predict(canvasRef);
        const actionKey = this.labelToKey(label);
        this.setState({ actionKey, probability });
        doSometing(actionKey);
        await sleep(this.state.interval);
      }
      onAi(false);
    });
  };

  test = () => {
    this.predict();
  };
  drive = () => {
    this.predict((actionKey) => {
      const { speed, direction } = this.props.controller;
      const action = aiAction[actionKey].action;
      speed(0);
      speed(action.speed);
      direction(action.direction);
    });
  };
  stop = () => {
    this.setState({ isPredicting: false });
  };
  loadModel = async () => {
    await this.props.ai.load("test");
    message.success("模型已经加载！");
  };
  downloadModel = () => {};
  render() {
    const {
      state: { isPredicting, actionKey, probability, interval },
      props: { cameraEnabled, ai },
      drive,
      stop,
      test,
      loadModel,
    } = this;
    return (
      <div className="ai-train">
        <Form layout="inline">
          <Form.Item label="操作间隔">
            <InputNumber
              value={interval}
              onChange={(interval) => this.setState({ interval })}
            />
          </Form.Item>
          <Form.Item label="动作">
            <Tag>
              {aiAction[actionKey].name} {aiAction[actionKey].icon}{" "}
              {probability.toFixed(2)}
            </Tag>
          </Form.Item>
        </Form>
        <br />
        <Form layout="inline">
          <Form.Item>
            <Button
              icon={<ImportOutlined />}
              loading={isPredicting}
              onClick={loadModel}
            >
              导入模型
            </Button>
          </Form.Item>
          <Form.Item>
            <Button
              icon={<BugOutlined />}
              loading={isPredicting}
              onClick={test}
              disabled={!cameraEnabled || !ai || !ai.model}
            >
              测试
            </Button>
            &nbsp;&nbsp;&nbsp;&nbsp;
            <Button
              type="danger"
              key="predic"
              loading={isPredicting}
              onClick={drive}
              icon={<CarOutlined />}
              disabled={!cameraEnabled || !ai || !ai.model}
            >
              开始 Ai 驾驶
            </Button>
          </Form.Item>

          <Form.Item>
            <Button
              onClick={stop}
              icon={<StopOutlined />}
              disabled={!isPredicting}
              key="stop"
            >
              停止 Ai 驾驶
            </Button>
          </Form.Item>
          <br />
        </Form>
      </div>
    );
  }
}
