import React, { Component, createRef } from "react";
import CocoSSD from "../lib/CocoSSD";
import { Spin, Button, Form, InputNumber, Select } from "antd";
import { sleep } from "../unit";
import { CarOutlined, StopOutlined } from "@ant-design/icons";

export default class ObjectDetection extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      targetClass: undefined,
      threshold: 0.5,
      detectionList: [],
      interval: 200,
      driving: false,
      detecting: false,
      widthThreshold: 100,
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
      if (targetClass && i.class === targetClass && i.score > threshold) {
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

    console.log("number of detections: ", result.length);
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
      },
      state: { widthThreshold },
    } = this;
    const { width, height } = canvasRef;
    if (!target) {
      speed(0);
      return;
    }
    const {
      bbox: [x, y, w, h],
    } = target;
    const c = x + w / 2;
    if (w > widthThreshold) {
      speed(-1);
    } else {
      speed(1);
    }

    direction(((c / width) * -2 + 1) * 1.5);
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
        widthThreshold,
      },
      props: { videoSize, cameraEnabled },
      startDetect,
      start,
      stop,
      stopDetect,
    } = this;
    return (
      <div className="ai-object-detection">
        <Spin spinning={loading} tip={loading}>
          <Form layout="inline" style={{ padding: "1em" }}>
            <Form.Item label="目标">
              <Select
                value={targetClass}
                onChange={(targetClass) => this.setState({ targetClass })}
                style={{ width: "10vw" }}
              >
                {detectionList.map((i) => (
                  <Select.Option value={i}>{i}</Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="目标阀值">
              <InputNumber
                value={threshold}
                onChange={(threshold) => this.setState({ threshold })}
                max={1}
                min={0}
              />
            </Form.Item>
            <Form.Item label="后退阀值">
              <InputNumber
                value={widthThreshold}
                onChange={(widthThreshold) => this.setState({ widthThreshold })}
              />
            </Form.Item>
            <Form.Item label="间隔">
              <InputNumber
                value={interval}
                onChange={(interval) => this.setState({ interval })}
              />
            </Form.Item>
            <Form.Item>
              <Button onClick={startDetect} disabled={detecting}>
                开始检测
              </Button>
            </Form.Item>
            <Form.Item>
              <Button onClick={stopDetect} disabled={!detecting}>
                停止检测
              </Button>
            </Form.Item>
            <Form.Item>
              <Button
                icon={<CarOutlined />}
                type="danger"
                onClick={start}
                disabled={!detecting || driving}
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
