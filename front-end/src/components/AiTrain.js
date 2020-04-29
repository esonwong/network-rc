import React, { Component, createRef } from "react";
import { Form, Button, Spin, InputNumber, Select, message } from "antd";
import { layout, tailLayout } from "../unit";
import { Link } from "@reach/router";
import { ExportOutlined, ReadOutlined } from "@ant-design/icons";
import { aiAction } from "./AiSample";

const { Option } = Select;
export default class AiTrain extends Component {
  constructor(props) {
    super(props);
    this.state = {
      learnArgument: {
        learnRate: 0.0001,
        batchSize: 0.4,
        epochs: 20,
        hiddenUnits: 100,
      },
      loss: undefined,
      loading: false,
      model: undefined,
    };

    this.smallCanvasRef = createRef();
  }

  componentDidMount() {
    this.props.controller.changeCamera(false);
  }

  train = async (learnArgument) => {
    const {
      props: { sampleList, ai },
    } = this;
    this.setState({ loading: "数据处理..." });
    ai.clean();
    for (let index = 0; index < sampleList.length; index++) {
      const { img: url, action } = sampleList[index];
      await ai.addExample(url, aiAction[action].label);
    }
    this.setState({ loading: "训练..." });
    await ai.train(learnArgument, (loss) => this.setState({ loss }));
    this.setState({ loading: false });
  };

  render() {
    const {
      state: { learnArgument, loss, loading },
      props: { sampleList, ai },
      train,
    } = this;
    return (
      <div className="ai-train">
        <Spin spinning={loading} tip={loading}>
          <Form {...layout} initialValues={learnArgument} onFinish={train}>
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
                loading={loading}
                disabled={!sampleList.length}
                icon={<ReadOutlined />}
                htmlType="submit"
              >
                学习(样本{sampleList.length})
              </Button>
              &nbsp; &nbsp; &nbsp; &nbsp;
              <Button
                onClick={async () => {
                  await ai.save("test");
                  message.success("模型已经保存");
                }}
                icon={<ExportOutlined />}
                disabled={!sampleList.length}
              >
                导出模型
              </Button>
            </Form.Item>
          </Form>
          <Form>
            <Form.Item {...tailLayout}>
              <Link to="../drive">
                <Button type="primary" disabled={!ai || !ai.model}>
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
