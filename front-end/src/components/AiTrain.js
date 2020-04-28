import React, { Component, createRef } from "react";
import { Form, Button, Spin, InputNumber, Select } from "antd";
import { layout, tailLayout } from "../unit";
import { Link } from "@reach/router";
import { ExportOutlined, ReadOutlined } from "@ant-design/icons";

const { Option } = Select;
export default class AiTrain extends Component {
  constructor(props) {
    super(props);
    this.state = {
      learnArgument: {
        learnRate: 0.001,
        batchSize: 0.4,
        epochs: 20,
        hiddenUnits: 100,
      },
      loss: undefined,
      isTraining: false,
      loading: false,
      model: undefined,
    };

    this.smallCanvasRef = createRef();
  }

  train = () => {
    // ToDo: 训练模型
    const model = undefined;
    this.this.setState({ model });
  };

  render() {
    const {
      state: { learnArgument, loss, isTraining, loading, model },
      props: { sampleList, onFinish },
      train,
    } = this;
    return (
      <div className="ai-train">
        <Spin spinning={loading}>
          {/* <canvas className="ai-canvas" ref={this.smallCanvasRef}></canvas> */}
          <Form {...layout} initialValues={learnArgument} onFinish={this.train}>
            <Form.Item label="Learning rate" name="learnRate">
              <Select>
                <Option value={0.00001}>0.00001</Option>
                <Option value={0.0001}>0.0001</Option>
                <Option value={0.001}>0.001</Option>
                <Option value={0.003}>0.003</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Batch Size" name="batchSize">
              <Select>
                <Option value={0.05}>0.05</Option>
                <Option value={0.1}>0.1</Option>
                <Option value={0.4}>0.4</Option>
                <Option value={1}>1</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Epochs" name="epochs">
              <Select>
                <Option value={10}>10</Option>
                <Option value={20}>20</Option>
                <Option value={40}>40</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Hidden units" name="hiddenUnits">
              <Select>
                <Option value={100}>100</Option>
                <Option value={200}>200</Option>
                <Option value={300}>300</Option>
                <Option value={400}>400</Option>
                <Option value={500}>500</Option>
              </Select>
            </Form.Item>
            <Form.Item label="loss">
              <InputNumber value={loss} disabled />
            </Form.Item>
            <Form.Item {...tailLayout}>
              <Button
                key="fit"
                loading={isTraining}
                disabled={!sampleList.length}
                onClick={train}
                icon={<ReadOutlined />}
              >
                学习
              </Button>
              &nbsp; &nbsp; &nbsp; &nbsp;
              <Button icon={<ExportOutlined />} disabled={!sampleList.length}>
                导出
              </Button>
            </Form.Item>
            <Form.Item {...tailLayout}>
              <Link to="drive">
                <Button
                  type="primary"
                  onClick={() => onFinish(model)}
                  disabled={!model}
                >
                  下一步
                </Button>
              </Link>
            </Form.Item>
          </Form>
        </Spin>
      </div>
    );
  }
}
