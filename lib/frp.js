const spawn = require("child_process").spawn;

console.info("启用网络穿透，远程端口：",process.env.FRP_REMOTE_PORT  );
const frp = spawn("./frpc/frpc",["-c","./frpc/frpc.ini"])
frp.stdout.pipe(process.stdout);
