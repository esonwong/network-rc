import React, { Component } from "react";
import { Form, Button } from "antd";
import {
  ImportOutlined,
  CarOutlined,
  StopOutlined,
  BugOutlined,
} from "@ant-design/icons";
import { aiAction } from "./AiSample";

export default class AiDrive extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isPredicting: false,
      action: "stop",
    };
  }
  test = () => {
    this.setState({ isPredicting: true });
  };
  drive = () => {
    this.setState({ isPredicting: true });
  };
  stop = () => {
    this.setState({ isPredicting: false });
  };
  loadModel = () => {};
  downloadModel = () => {};
  render() {
    const {
      state: { isPredicting, action },
      props: { cameraEnable },
      drive,
      stop,
      test,
    } = this;
    return (
      <div className="ai-train">
        <Form layout="inline">
          <Form.Item>
            <Button
              icon={<ImportOutlined />}
              loading={isPredicting}
              onClick={test}
            >
              导入模型
            </Button>
          </Form.Item>
        </Form>
        <br />
        <Form layout="inline">
          <Form.Item>
            <Button
              icon={<BugOutlined />}
              loading={isPredicting}
              onClick={test}
              disabled={!cameraEnable}
            >
              测试
            </Button>
          </Form.Item>
          <Form.Item>
            <Button
              type="danger"
              key="predic"
              loading={isPredicting}
              onClick={drive}
              icon={<CarOutlined />}
              disabled={!cameraEnable}
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
          <Form.Item label="动作">
            {aiAction[action].name} {aiAction[action].icon}
          </Form.Item>
        </Form>
      </div>
    );
  }
}
