import React, { Component } from "react";
import { Menu } from "antd";
import * as tf from "@tensorflow/tfjs";
import { loadTruncatedMobileNet, ControllerDataset, sleep } from "../unit";
import { Router, Link, Match } from "@reach/router";
import AiDrive from "./AiDrive";
import AiSample from "./AiSample";
import AiTrain from "./AiTrain";

let truncatedMobileNet, model;
const controllerDataset = new ControllerDataset();

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

  async componentDidMount() {
    this.setState({ loading: true });
    truncatedMobileNet = await loadTruncatedMobileNet();
    this.setState({ loading: false });
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

  exampleCleanHandler = async () => {
    this.setState({
      exampleList: [],
    });
    controllerDataset.clean();
  };

  exampleHandler = async (action) => {
    isBuildingExample = true;
    const {
      state: { exampleList },
      props: { action: propAction, canvasRef },
    } = this;

    const img = tf.browser.fromPixels(canvasRef);
    const smallImg = img.resizeNearestNeighbor([224, 224]);
    const processedImg = tf.tidy(() =>
      smallImg.expandDims(0).toFloat().div(127).sub(1)
    );
    const _action = action || propAction;
    const { speed, direction } = _action;
    console.log("example", _action);
    controllerDataset.addExample(truncatedMobileNet.predict(processedImg), [
      speed,
      direction,
    ]);
    await tf.browser.toPixels(smallImg, this.smallCanvasRef.current);
    exampleList.push({
      img: this.smallCanvasRef.current.toDataURL(),
      action: { speed, direction },
    });
    this.setState({ exampleList });
    img.dispose();
    isBuildingExample = false;
  };

  train = async (learnArgument) => {
    this.setState({
      isTraining: true,
    });
    console.log("Learnning Argument", learnArgument);
    if (controllerDataset.xs == null) {
      throw new Error("Add some examples before training!");
    }

    // Creates a 2-layer fully connected model. By creating a separate model,
    // rather than adding layers to the mobilenet model, we "freeze" the weights
    // of the mobilenet model, and only train weights from the new model.
    model = tf.sequential({
      layers: [
        // Flattens the input to a vector so we can use it in a dense layer. While
        // technically a layer, this only performs a reshape (and has no training
        // parameters).
        tf.layers.flatten({
          inputShape: truncatedMobileNet.outputs[0].shape.slice(1),
        }),
        // Layer 1.
        tf.layers.dense({
          units: learnArgument.hiddenUnits,
          activation: "relu",
          kernelInitializer: "varianceScaling",
          useBias: true,
        }),
        // Layer 2. The number of units of the last layer should correspond
        // to the number of classes we want to predict.
        tf.layers.dense({
          units: 2,
          kernelInitializer: "varianceScaling",
          useBias: false,
          activation: "softmax",
        }),
      ],
    });

    // Creates the optimizers which drives training of the model.
    const optimizer = tf.train.adam(learnArgument.learnRate);
    // We use categoricalCrossentropy which is the loss function we use for
    // categorical classification which measures the error between our predicted
    // probability distribution over classes (probability that an input is of each
    // class), versus the label (100% probability in the true class)>
    model.compile({ optimizer: optimizer, loss: "meanSquaredError" });

    // We parameterize batch size as a fraction of the entire dataset because the
    // number of examples that are collected depends on how many examples the user
    // collects. This allows us to have a flexible batch size.
    const batchSize = Math.floor(
      controllerDataset.xs.shape[0] * learnArgument.batchSize
    );
    if (!(batchSize > 0)) {
      throw new Error(
        `Batch size is 0 or NaN. Please choose a non-zero fraction.`
      );
    }

    // Train the model! Model.fit() will shuffle xs & ys so we don't have to.
    model.fit(controllerDataset.xs, controllerDataset.ys, {
      batchSize,
      epochs: learnArgument.epochs,
      callbacks: {
        onBatchEnd: async (batch, logs) => {
          console.log("Loss: " + logs.loss.toFixed(5));
          this.setState({ loss: logs.loss.toFixed(5) });
        },
        onTrainEnd: (logs) => {
          // const loss = logs.loss.toFixed(5);
          // console.log("Train End Loss: " + logs.loss.toFixed(5));
          this.setState({
            isTraining: false,
            // loss
          });
        },
      },
    });
  };

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
          await sleep(200);
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
      //     await sleep(1000);
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
      state: { sampleList },
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
          />
          <AiTrain
            path="train"
            sampleList={sampleList}
            onFinish={(model) => this.setState({ model })}
            cameraEnabled={cameraEnabled}
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
