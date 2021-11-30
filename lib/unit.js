const spawn = require("child_process").spawn;
const { readFileSync } = require("fs");
const { writeFileSync } = require("fs-path");

exports.sleep = async function (time) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
};

/** 执行命令获得输出结果， 参数不支持空格 */
exports.asyncCommand = async function (command, outType = "stdout") {
  const list = command.split(" ");
  try {
    return new Promise((resolve) => {
      let stdoutText = "";
      let stderrText = "";
      const [programe, ...other] = list;
      const cmd = spawn(programe, other);
      cmd.stdout.on("data", (buffer) => {
        stdoutText += buffer.toString();
      });
      cmd.stderr.on("data", (buffer) => {
        stderrText += buffer.toString();
      });
      cmd.on("exit", () => {
        resolve(outType === "stdout" ? stdoutText : stderrText);
      });
    });
  } catch (e) {
    console.error("async command error", e);
  }
};

exports.localSave = (path, data) => {
  try {
    writeFileSync(path, JSON.stringify(data));
  } catch (error) {
    console.error(`保存 ${path} 失败`, error);
  }
};

exports.localGet = (path) => {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    return {};
  }
};

exports.configDir = `${require("os").homedir()}/.network-rc`;
