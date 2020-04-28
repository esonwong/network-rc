import React, { Component } from "react";
import { Menu } from "antd";
import * as tf from "@tensorflow/tfjs";
import { Router, Link, Match } from "@reach/router";
import AiDrive from "./AiDrive";
import AiSample from "./AiSample";
import AiTrain from "./AiTrain";

let truncatedMobileNet, model;

let isBuildingExample = false;

const menu = [
  { key: "sample", name: "采集样本" },
  { key: "train", name: "学习训练" },
  { key: "drive", name: "自动驾驶" },
];

export default class Ai extends Component {
  constructor(props) {
    super(props);
    this.state = {
      learnForm: {},
      exampleList: [],
      sampleList: [],
      loading: false,
      training: false,
      isPredicting: false,
      isRecording: false,
      loss: 0,
    };
  }


  componentDidUpdate(prevProps, prevState) {
    if (
      prevProps.action !== this.props.action &&
      this.state.isRecording &&
      !isBuildingExample
    ) {
      this.exampleHandler(this.props.action);
    }
  }




  predict = async () => {
    const {
      props: { canvasRef, onAi },
    } = this;
    onAi(true);
    this.setState(
      {
        isPredicting: true,
      },
      async () => {
        while (this.state.isPredicting) {
          const img = tf.tidy(() =>
            tf.browser
              .fromPixels(canvasRef)
              .resizeNearestNeighbor([224, 224])
              .expandDims(0)
              .toFloat()
              .div(127)
              .sub(1)
          );

          // Make a prediction through mobilenet, getting the internal activation of
          // the mobilenet model, i.e., "embeddings" of the input images.
          const embeddings = truncatedMobileNet.predict(img);

          // Make a prediction through our newly-trained model using the embeddings
          // from mobilenet as input.
          const predictions = model.predict(embeddings);

          // Returns the index with the maximum probability. This number corresponds
          // to the class the model thinks is the most probable given the input.

          const [speed, direction] = await predictions.data();

          const action = {
            speed,
            direction,
          };
          console.log("Ai 动作：", action);
          img.dispose();

          this.doAction(action);
          await tf.nextFrame();
        }
        onAi(false);
      }
    );
  };
  record = async () => {
    this.setState(
      {
        isRecording: true,
      }
      // async () => {
      //   while (this.state.isRecording) {
      //     await this.exampleHandler();
      //   }
      // }
    );
  };

  menuItem = ({ key, name }) => {
    return (
      <Menu.Item key={key}>
        <Link to={`./${key}`}>{name}</Link>
      </Menu.Item>
    );
  };

  render() {
    const {
      state: { sampleList, model },
      props: { controller, cameraEnabled, canvasRef },
      menuItem,
    } = this;

    return (
      <div>
        <Match path=":current">
          {(props) => (
            <Menu
              selectedKeys={[props.match && props.match.current]}
              mode="horizontal"
            >
              {menu.map((i) => menuItem(i))}
            </Menu>
          )}
        </Match>
        <Router>
          <AiSample
            path="sample"
            onFinish={(sampleList) => this.setState({ sampleList })}
            sampleList={sampleList}
            canvasRef={canvasRef}
            cameraEnabled={cameraEnabled}
            controller={controller}
          />
          <AiTrain
            path="train"
            sampleList={sampleList}
            onFinish={(model) => this.setState({ model })}
            controller={controller}
          />
          <AiDrive
            path="drive"
            model={model}
            controller={controller}
            canvasRef={canvasRef}
          />
        </Router>
      </div>
    );
  }
}
