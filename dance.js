const controller = require("./lib/controller.js");
const argv = require("yargs")
  .usage("Usage: $0 [options]")
  .example("$0 -f -o 9088", "开启网络穿透")
  .options({
    c: {
      alias: "command",
      default: "./dance.yml",
    }
  }).argv;

const { join } = require("path");
const yaml = require('js-yaml');
const fs = require('fs');

async function sleep(time) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
}

const { commands, nodes } = yaml.safeLoad(fs.readFileSync(join(__dirname, argv.command), 'utf8'));



const runAction = ({ type, value, index }) => {
  if (index === undefined) {
    controller[type](value);
  } else {
    controller[type](index, value);
  }
}

const runActions = async (actions = []) => {
  actions.forEach(runAction);
}

const runNode = async (node = [], last = false) => {
  for (let index = 0; index < node.length; index++) {
    const { time, actions, nodeName, t = 1, keep = 1000 } = node[index];
    if (actions) {
      await runActions(actions)
    };
    let long = 0;
    if (nodeName) {
      const startTime = new Date().getTime();
      console.log(`Node ${nodeName} ${t} 次开始`);
      for (let j = 0; j < t; j++) {
        await runNode(nodes[nodeName], j + 1 === t)
      }
      console.log(`Node ${nodeName} ${t} 次结束`);
      long = new Date().getTime() - startTime;
    }
    if (node[index + 1]) {
      const interval = new Date(`0 00:${node[index + 1].time}`).getTime() - new Date(`0 00:${time}`).getTime() - long;
      console.log("等待", interval);
      await sleep(interval);
    } else {
      await sleep(last ? 0 : keep);
    }
  }
}

(async function () {
  await runNode(commands);
  await sleep(3000);
})();

process.on("beforeExit", function () {
  controller.closeController();
  console.log("Goodbye!");
});

process.on("SIGINT", function () {
  process.exit();
});