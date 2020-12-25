const spawn = require("child_process").spawn;

exports.sleep = async function (time) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
}

/** 执行命令获得输出结果， 参数不支持空格 */
exports.asyncCommand = async function (command) {
  const list = command.split(' ')
  try {
    return new Promise(resolve => {
      let stdoutText = ''
      const [programe, ...other] = list
      const cmd = spawn(programe, other)
      cmd.stdout.on('data', buffer => {
        stdoutText += buffer.toString()
      })
      cmd.on('exit', () => { resolve(stdoutText) })
    })
  } catch (e) {
    console.error('async command error', e)
  }
}
