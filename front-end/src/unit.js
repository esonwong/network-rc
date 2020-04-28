import * as tf from "@tensorflow/tfjs";

export const layout = {
  labelCol: {
    span: 6,
  },
  wrapperCol: {
    span: 16,
  },
};

export const tailLayout = {
  wrapperCol: { offset: 6, span: 16 },
};

export const marks = {
  0: "0%",
  25: "25%",
  50: "50%",
  75: "75%",
  100: "100%",
};

export async function loadTruncatedMobileNet() {
  const mobilenet = await tf.loadLayersModel(
    "https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_1.0_224/model.json"
  );
  // Return a model that outputs an internal activation.
  const layer = mobilenet.getLayer("conv_pw_13_relu");
  return tf.model({ inputs: mobilenet.inputs, outputs: layer.output });
}

export async function getImageUrl(canvas) {
  let smallCanvas = document.getElementById("small-canvas");
  if (!smallCanvas) {
    smallCanvas = document.createElement("canvas");
    smallCanvas.id = "small-canvas";
    smallCanvas.width = 224;
    smallCanvas.height = 224;
  }
  const img = tf.browser.fromPixels(canvas);
  const smallImg = img.resizeNearestNeighbor([224, 224]);
  await tf.browser.toPixels(smallImg, smallCanvas);
  return smallCanvas.toDataURL();
}

export async function imageUrlToImg(dataURL) {
  return await new Promise((resolve) => {
    const img = new Image();
    img.addEventListener("load",() => {
      resolve(tf.browser.fromPixels(img));
    });
    img.src = dataURL;
  });
}

const NUM_CLASSES = 5;
export class Ai {
  constructor() {
    return (async () => {
      this.truncatedMobileNet = await loadTruncatedMobileNet();
      return this;
    })();
  }

  /**
   * Adds an example to the controller dataset.
   * @param {Tensor} example A tensor representing the example. It can be an image,
   *     an activation, or any other type of Tensor.
   * @param {[number]} action speed and direction.
   */
  async addExample(url, lable) {
    const data = await imageUrlToImg(url);
    const oImg = tf.tidy(() => data.expandDims(0).toFloat().div(127).sub(1));
    const example = this.truncatedMobileNet.predict(oImg);
    oImg.dispose();
    const y = tf.tidy(() =>
      tf.oneHot(tf.tensor1d([lable]).toInt(), NUM_CLASSES)
    );

    if (this.xs == null) {
      // For the first example that gets added, keep example and y so that the
      // ControllerDataset owns the memory of the inputs. This makes sure that
      // if addExample() is called in a tf.tidy(), these Tensors will not get
      // disposed.
      this.xs = tf.keep(example);
      this.ys = tf.keep(y);
    } else {
      const oldX = this.xs;
      this.xs = tf.keep(oldX.concat(example, 0));

      const oldY = this.ys;
      this.ys = tf.keep(oldY.concat(y, 0));

      oldX.dispose();
      oldY.dispose();
      y.dispose();
    }
  }
  clean() {
    this.xs.dispose();
    this.ys.dispose();
    this.xs = null;
    this.ys = null;
  }

  async train(learnArgument, lossCallBack) {
    console.log("Learnning Argument", learnArgument);
    if (this.xs == null) {
      throw new Error("Add some examples before training!");
    }

    // Creates a 2-layer fully connected model. By creating a separate model,
    // rather than adding layers to the mobilenet model, we "freeze" the weights
    // of the mobilenet model, and only train weights from the new model.
    const model = tf.sequential({
      layers: [
        // Flattens the input to a vector so we can use it in a dense layer. While
        // technically a layer, this only performs a reshape (and has no training
        // parameters).
        tf.layers.flatten({
          inputShape: this.truncatedMobileNet.outputs[0].shape.slice(1),
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
          units: NUM_CLASSES,
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
    model.compile({ optimizer: optimizer, loss: "categoricalCrossentropy" });

    // We parameterize batch size as a fraction of the entire dataset because the
    // number of examples that are collected depends on how many examples the user
    // collects. This allows us to have a flexible batch size.
    const batchSize = Math.floor(this.xs.shape[0] * learnArgument.batchSize);
    if (!(batchSize > 0)) {
      throw new Error(
        `Batch size is 0 or NaN. Please choose a non-zero fraction.`
      );
    }

    // Train the model! Model.fit() will shuffle xs & ys so we don't have to.
    await model.fit(this.xs, this.ys, {
      batchSize,
      epochs: learnArgument.epochs,
      callbacks: {
        onBatchEnd: async (batch, logs) => {
          console.log("Loss: " + logs.loss.toFixed(5));
          lossCallBack(logs.loss.toFixed(5));
        },
      },
    });

    return model;
  }
}

export async function sleep(time) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
}

export function vibrate(v) {
  navigator.vibrate && navigator.vibrate(v);
}
