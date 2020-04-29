import React, { Component } from "react";
import {
  ArrowDownOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  ArrowUpOutlined,
  PauseOutlined,
  ImportOutlined,
  ExportOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { Form, Button, List, Card, Upload } from "antd";
import { Link } from "@reach/router";
import { getImageUrl } from "../unit";
import { saveAs } from "file-saver";

export const aiAction = {
  left: {
    icon: <ArrowLeftOutlined />,
    name: "左转弯",
    action: { speed: 1, direction: 1 },
    label: 0,
  },
  right: {
    icon: <ArrowRightOutlined />,
    name: "右转弯",
    action: { speed: 1, direction: -1 },
    label: 1,
  },
  forward: {
    icon: <ArrowUpOutlined />,
    name: "前进",
    action: { speed: 1, direction: 0 },
    label: 2,
  },
  back: {
    icon: <ArrowDownOutlined />,
    action: { speed: -1, direction: 0 },
    name: "后退",
    label: 3,
  },
  stop: {
    icon: <PauseOutlined />,
    action: { speed: 0, direction: 0 },
    name: "停止",
    label: 4,
  },
};

export default class AiSample extends Component {
  constructor(props) {
    super(props);
    this.state = {
      sampleList: props.sampleList || [],
      exportName: "自动驾驶学习样本",
    };
  }

  componentDidMount() {
    this.props.controller.changeCamera(true);
  }

  async add(example) {
    const {
      props: { canvasRef },
    } = this;
    const { sampleList } = this.state;
    sampleList.unshift({
      ...example,
      img: await getImageUrl(canvasRef),
    });
    this.setState({ sampleList });
  }

  update(index, action) {
    this.setState((state) => {
      state.sampleList[index].action = action;
      return state;
    });
  }

  remove(index) {
    const { sampleList } = this.state;
    sampleList.splice(index, 1);
    this.setState({ sampleList });
  }

  clear = () => {
    this.setState({ sampleList: [] });
  };

  upload = ({ file, onSuccess }) => {
    const reader = new FileReader();
    reader.onload = ({ target: { result } }) => {
      const data = JSON.parse(result);
      const { sampleList } = this.state;
      this.setState({
        sampleList: sampleList.concat(data),
      });
      onSuccess();
    };
    reader.readAsText(file);
    return true;
  };

  download = () => {
    const { sampleList, exportName } = this.state;
    saveAs(new Blob([JSON.stringify(sampleList)]), `${exportName}.json`);
  };

  render() {
    const {
      clear,
      download,
      upload,
      props: { onFinish, cameraEnabled },
    } = this;
    const { sampleList } = this.state;
    return (
      <div className="ai-sample">
        <Form layout="inline" className="ai-sample-form">
          {Object.keys(aiAction).map((key) => (
            <Form.Item>
              <Button
                icon={aiAction[key].icon}
                onClick={() => this.add({ action: key })}
                disabled={!cameraEnabled}
              >{aiAction[key].name}</Button>
            </Form.Item>
          ))}
          <Form.Item>
            <Upload
              customRequest={upload}
              accept="application/json"
              showUploadList={false}
            >
              <Button icon={<ImportOutlined />}>导入</Button>
            </Upload>
          </Form.Item>
          <Form.Item>
            <Button
              icon={<ExportOutlined />}
              disabled={!sampleList.length}
              onClick={download}
            >
              导出
            </Button>
          </Form.Item>
          <Form.Item>
            <Button type="danger" disabled={!sampleList.length} onClick={clear}>
              清除
            </Button>
          </Form.Item>
          <Form.Item>
            <Link to="../train">
              <Button
                type="primary"
                disabled={sampleList.length < 10}
                onClick={() => {
                  onFinish(sampleList);
                }}
              >
                下一步
              </Button>
            </Link>
          </Form.Item>
        </Form>
        <List
          size="small"
          className="ai-example-list"
          grid={{ gutter: 16, column: 4 }}
          itemLayout="vertical"
          pagination={{
            pageSize: 12,
          }}
          dataSource={sampleList}
          renderItem={({ img, action }, index) => (
            <List.Item>
              <Card
                size="small"
                title={aiAction[action].icon}
                actions={[
                  <Button
                    size="small"
                    icon={<CloseOutlined />}
                    type="danger"
                    onClick={() => this.remove(index)}
                  />,
                ]}
              >
                <img
                  style={{ width: "100%" }}
                  src={img}
                  alt="example"
                  onLoad={function ({ target }) {
                    target.height = target.width * 0.75;
                  }}
                />
              </Card>
            </List.Item>
          )}
        />
      </div>
    );
  }
}
