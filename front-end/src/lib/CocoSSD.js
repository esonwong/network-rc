import * as cocoSsd from "@tensorflow-models/coco-ssd";
export default class CocoSSD {
  constructor() {
    return (async () => {
      this.model = await cocoSsd.load({
        base: "lite_mobilenet_v2",
      });
      console.log("model loaded");
      return this;
    })();
  }

  async predict(image) {
    // console.time("predict1");
    const result = await this.model.detect(image);
    // console.timeEnd("predict1");
    // console.log(result);
    return result;
  }
}
