#!/bin/bash

echo $NETWORK_RC_BETA


function rand(){
    min=$1
    max=$(($2-$min+1))
    num=$(($RANDOM+1000000000)) #增加一个10位的数再求余
    echo $(($num%$max+$min))
}

read -p "使用内置 frp 服务器(yes/no, 默认 yes):" defaultFrp
defaultFrp=${defaultFrp:yes}


read -p "frp remote_port(用于访问遥控车控制界面, 如: 9020-9999 可用, 默认随机):" frpPort
defaultPort=$(rand 9020 9999)


frpPort=${frpPort:-$defaultPort}
read -p "Network RC 密码(默认 networkrc):" password
password=${password:-networkrc}

if [ "$defaultFrp" = "no" ]; then
  read -p "frp 服务器地址(默认: gz.esonwong.com):" frpServer
  read -p "frp 服务器连接端口, server_port(默认9099):" frpServerPort
  read -p "frp user:" frpServerUser
  read -p "frp token:" frpServerToken
  read -p "https 证书 cert 路径:" -e tslCertPath
  read -p "https 证书 key 路径:" -e tslKeyPath
fi

defaultFrp=${defaultFrp:yes}
frpServer="${frpServer:-gz.esonwong.com}"
frpServerPort="${frpServerPort:-9099}"
frpServerToken="${frpServerToken:-"eson's network-rc"}"
frpServerUser="${frpServerUser:-""}"
tslCertPath="${tslCertPath:-"/home/pi/network-rc/lib/frpc/gz.esonwong.com/fullchain.pem"}"
tslKeyPath="${tslKeyPath:-"/home/pi/network-rc/lib/frpc/gz.esonwong.com/privkey.pem"}"


echo ""
echo ""
echo ""
echo "你的设置如下"
echo "frp 服务器地址: $frpServer"
echo "frp 服务器连接端口, server_port: $frpServerPort"
echo "frp user: $frpServerUser"
echo "frp token: $frpServerToken"
echo "frp remote_port(用于访问遥控车控制界面): $frpPort" 
echo "https 证书 cert 路径: $tslCertPath"
echo "https 证书 key 路径: $tslKeyPath"
echo ""
echo ""
echo ""
echo "Network RC 控制界面访问地址: https://$frpServer:$frpPort"
echo "Network RC 控制界面访问密码: $password"
echo ""
echo ""
echo ""


read -p "输入 ok 继续， 输入其他结束:" ok
echo "$ok"


if [ "$ok" = "ok" ]; then

echo ""
echo ""
echo ""
echo "安装依赖"
sudo apt update
sudo apt install ffmpeg pulseaudio -y


echo ""
echo ""
echo ""
sudo rm -f /tmp/network-rc.tar.gz
if [ $NETWORK_RC_BETA -eq 1 ]; then
  echo "下载 Network RC beta 版本"
  wget -O /tmp/network-rc.tar.gz https://download.esonwong.com/network-rc/network-rc-beta.tar.gz
else
  echo "下载 Network RC"
  wget -O /tmp/network-rc.tar.gz https://download.esonwong.com/network-rc/network-rc.tar.gz
fi

echo ""
echo ""
echo ""
echo "解压 Network RC 中..."
tar -zxf /tmp/network-rc.tar.gz -C /home/pi/


echo ""
echo ""
echo ""
echo "安装 Network RC 服务"

echo "[Unit]
Description=network-rc
After=syslog.target  network.target
Wants=network.target

[Service]
User=pi
Type=simple
ExecStart=/home/pi/network-rc/node /home/pi/network-rc/index.js --tsl -f $frpServer -o $frpPort -p \"$password\" --frpServerPort $frpServerPort --frpServerToken \"$frpServerToken\" --frpServerUser \"${frpServerUser}\" --tslCertPath \"${tslCertPath}\" --tslKeyPath \"${tslKeyPath}\"
Restart=always
RestartSec=15s

[Install]
WantedBy=multi-user.target" | sudo tee /etc/systemd/system/network-rc.service

echo ""
echo ""
echo "创建 Network RC 服务完成"


sudo systemctl enable network-rc.service
echo "重启 Network RC 服务"
sudo systemctl restart network-rc.service


echo ""
echo ""
echo ""
echo "安装 Network RC 完成"
echo "Network RC 控制界面访问地址: https://$frpServer:$frpPort"
echo "Network RC 控制界面访问密码: $password"

else 
exit 0
fi




