const util = require("util");
const pkg = require("./package.json");
const exec = util.promisify(require("child_process").exec);

const argv = require("yargs").options({
  b: {
    alias: "beta",
    describe: "密码",
    type: "boolean",
    default: false,
  },
}).argv;

const beta = argv.beta;

const fullFileName = `${pkg.name}-${pkg.version}${beta ? "-beta" : ""}.tar.gz`;
const fileName = `${pkg.name}${beta ? "-beta" : ""}.tar.gz`;

(async function () {
  try {
    console.log("上传到 nas");

    // await exec(
    //   `scp -P 5022 dist/network-rc.tar.gz itiwll@192.168.50.2:/volume1/web/network-rc/download/${fileName}`
    // );

    // await exec(
    //   `scp -P 5022 dist/network-rc.tar.gz itiwll@192.168.50.2:/volume1/web/network-rc/download/${fullFileName}`
    // );

    console.log("上传 一键安装脚本");

    await exec(
      `scp -P 29168 ./install.sh root@download.esonwong.com:/www/download/network-rc/install.sh`
    );

    console.log(`上传 ${fileName} 到 download.esonwong.com`);

    await exec(
      `scp -P 29168 dist/network-rc.tar.gz root@download.esonwong.com:/www/download/network-rc/${fileName}`
    );

    console.log(`上传 ${fullFileName} 到 download.esonwong.com`);

    await exec(
      `scp -P 29168 dist/network-rc.tar.gz root@download.esonwong.com:/www/download/network-rc/${fullFileName}`
    );
  } catch (e) {
    console.error(e);
  }
})();
