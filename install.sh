#!/bin/bash



function rand(){
    min=$1
    max=$(($2-$min+1))
    num=$(($RANDOM+1000000000)) #增加一个10位的数再求余
    echo $(($num%$max+$min))
}

read -p "使用内置 frp 服务器(yes/no, 默认 yes):" defaultFrp
defaultFrp=${defaultFrp:yes}


read -p "Network RC 密码(默认 networkrc):" password
password=${password:-networkrc}

if [ "$defaultFrp" = "no" ]; then
read -p "frp 服务器地址(如: gz.esonwong.com):" frpServer
read -p "frp 服务器连接端口, server_port:" frpServerPort
read -p "frp user:" frpServerToken
read -p "frp token:" frpServerUser
read -p "frp remote_port(用于访问遥控车控制界面, 如: 9088):" frpPort
read -p "https 证书 cert 路径:" -e tslCertPath
read -p "https 证书 key 路径:" -e tslKeyPath
else
frpPort=$(rand 9010 9098)
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
echo "frp remote_port(用于访问遥控车控制界面, 如: 9088): $frpPort" 
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
echo "下载 Network RC"
sudo rm -f /tmp/network-rc.tar.gz
wget -O /tmp/network-rc.tar.gz https://network-rc.esonwong.com/download/network-rc.tar.gz

echo ""
echo ""
echo ""
echo "解压 Network RC 中..."
tar -zxf /tmp/network-rc.tar.gz -C /home/pi/


echo ""
echo ""
echo ""
echo "安装 Network RC 服务"

sudo bash -c "echo '[Unit]
Description=network-rc
After=syslog.target  network.target
Wants=network.target

[Service]
User=root
Type=simple
ExecStart=/home/pi/network-rc/node /home/pi/network-rc/index.js --tsl -f '$frpServer' -o '$frpPort' -p "'$password'" --frpServerPort '$frpServerPort' --frpServerToken "'$frpServerToken'" --frpServerUser '$frpServerUser' --tslCertPath '$tslCertPath' --tslKeyPath '$tslKeyPath'
Restart= always
RestartSec=1min


[Install]
WantedBy=multi-user.target' > /etc/systemd/system/network-rc.service"

sudo systemctl enable network-rc.service
sudo systemctl restart network-rc.service


echo ""
echo ""
echo ""
echo "安装 Network RC 完成"

else 
exit 0
fi




