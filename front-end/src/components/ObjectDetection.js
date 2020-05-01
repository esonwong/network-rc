import React, { Component, createRef } from "react";
import CocoSSD from "../lib/CocoSSD";
import {
  Spin,
  Button,
  Form,
  InputNumber,
  Slider,
  Popover,
  Switch,
  Radio,
  Tag,
} from "antd";
import { sleep } from "../unit";
import { CarOutlined, StopOutlined } from "@ant-design/icons";

export default class ObjectDetection extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      targetClass: undefined,
      threshold: 50,
      detectionList: ["person"],
      interval: 100,
      driving: false,
      detecting: false,
      pauseThreshold: 60,
    };
    this.canvas = createRef();
  }
  async componentDidMount() {
    this.setState({ loading: "加载模型..." });
    this.cocoSSD = await new CocoSSD();
    this.setState({ loading: false });
    this.props.controller.changeCamera(true);
  }

  detect = async () => {
    const {
      state: { targetClass, threshold, detectionList },
      props: { canvasRef, cameraEnabled },
      draw,
    } = this;
    if (!cameraEnabled) return;
    const result = await this.cocoSSD.predict(canvasRef);
    let target;
    result.forEach((i) => {
      if (!detectionList.some((c) => i.class === c)) {
        detectionList.push(i.class);
      }
      if (targetClass && i.class === targetClass && i.score > threshold / 100) {
        if (!target) {
          target = i;
        } else {
          if (target.score < i.score) {
            target = i;
          }
        }
      }
    });
    draw(result, target);
    return target;
  };

  draw = (result, target) => {
    const { canvas } = this;
    const context = canvas.current.getContext("2d");
    // context.drawImage(image, 0, 0);
    context.clearRect(0, 0, canvas.current.width, canvas.current.height);
    context.font = "10px Arial";
    for (let i = 0; i < result.length; i++) {
      context.beginPath();
      context.rect(...result[i].bbox);
      context.lineWidth = 1;
      context.strokeStyle = result[i] === target ? "red" : "green";
      context.fillStyle = result[i] === target ? "red" : "green";
      context.stroke();
      context.fillText(
        result[i].score.toFixed(3) + " " + result[i].class,
        result[i].bbox[0],
        result[i].bbox[1] > 10 ? result[i].bbox[1] - 5 : 10
      );
    }
  };

  startDetect = async () => {
    this.setState({ detecting: true }, async () => {
      while (this.state.detecting) {
        const target = await this.detect();
        if (this.state.driving) {
          this.drive(target);
        }
        await sleep(this.state.interval);
      }
    });
  };

  stopDetect = async () => {
    this.setState({ detecting: false, driving: false });
  };

  drive = async (target) => {
    const {
      props: {
        canvasRef,
        controller: { speed, direction },
        action,
      },
      state: { pauseThreshold },
    } = this;
    if (!target || !canvasRef) {
      if (action.speed === 0) return;
      speed(-0.5);
      speed(0);
      return;
    }
    const { width, height } = canvasRef;
    const {
      bbox: [x, y, w, h],
    } = target;
    const wc = x + w / 2;
    const s = ((h / height) * -2 + pauseThreshold / 50) * 3;
    speed(s);
    direction(((wc / width) * -2 + 1) * 1.5 * (s >= 0 ? 1 : -1));
  };

  start = () => {
    this.setState({ driving: true });
    this.props.onAi(true);
  };
  stop = () => {
    this.setState({ driving: false });
    this.props.controller.speed(0);
    this.props.onAi(false);
  };

  render() {
    const {
      state: {
        loading,
        threshold,
        interval,
        detecting,
        driving,
        detectionList,
        targetClass,
        pauseThreshold,
      },
      props: { videoSize, cameraEnabled, action },
      startDetect,
      start,
      stop,
      stopDetect,
    } = this;
    return (
      <div className="ai-object-detection">
        <Spin spinning={loading} tip={loading}>
          <Form
            className="inline-form"
            layout="inline"
            style={{ padding: "1em" }}
            size="small"
          >
            <Form.Item>
              <Switch
                onChange={(v) => (v ? startDetect() : stopDetect())}
                checked={detecting}
                disabled={!cameraEnabled}
                checkedChildren="检测"
                unCheckedChildren="检测"
              />
            </Form.Item>
            <Form.Item>
              <Popover
                placement="topLeft"
                content={
                  <Radio.Group
                    onChange={({ target: { value: targetClass } }) =>
                      this.setState({ targetClass })
                    }
                    value={targetClass}
                  >
                    {detectionList.map((i) => (
                      <Radio value={i}>{i}</Radio>
                    ))}
                  </Radio.Group>
                }
              >
                <Button shape="round">目标:{targetClass || "无"}</Button>
              </Popover>
            </Form.Item>
            <Form.Item>
              <Popover
                placement="topLeft"
                content={
                  <Slider
                    min={0}
                    max={100}
                    value={threshold}
                    onChange={(threshold) => this.setState({ threshold })}
                    arrowPointAtCenter
                    style={{ width: "30vw" }}
                  />
                }
              >
                <Button shape="round">目标阀值:{threshold}</Button>
              </Popover>
            </Form.Item>
            <Form.Item>
              <Popover
                placement="topLeft"
                content={
                  <Slider
                    min={0}
                    max={100}
                    value={pauseThreshold}
                    onChange={(pauseThreshold) =>
                      this.setState({ pauseThreshold })
                    }
                    arrowPointAtCenter
                    style={{ width: "30vw" }}
                  />
                }
              >
                <Button shape="round">跟随阀值:{pauseThreshold}</Button>
              </Popover>
            </Form.Item>
            <Form.Item>
              <Popover
                placement="topLeft"
                content={
                  <InputNumber
                    min={0}
                    max={1000}
                    value={interval}
                    onChange={(interval) => this.setState({ interval })}
                  />
                }
              >
                <Button shape="round">间隔:{interval} ms</Button>
              </Popover>
            </Form.Item>

            <Form.Item>
              <Button
                icon={<CarOutlined />}
                type="danger"
                onClick={start}
                disabled={!detecting || driving || !targetClass}
              >
                开始驾驶
              </Button>
            </Form.Item>
            <Form.Item>
              <Button
                icon={<StopOutlined />}
                onClick={stop}
                disabled={!driving}
              >
                停止驾驶
              </Button>
            </Form.Item>

            <Form.Item>
              <Tag>方向{action.direction.toFixed(2)}</Tag>
              <Tag>油门{action.speed.toFixed(2)}</Tag>
            </Form.Item>
          </Form>
        </Spin>
        <div
          className="ai-object-detection-canvas-container"
          style={{
            opacity: cameraEnabled ? 1 : 0,
            transform: `scale(${videoSize / 50})`,
          }}
        >
          <canvas ref={this.canvas} width="400" height="300"></canvas>
        </div>
      </div>
    );
  }
}
