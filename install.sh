#!/bin/bash

if test "$NETWORK_RC_BETA" = "1"; then
  echo '安装 Beta 版'
else
  echo '开始安装 Network RC'
fi

read -p "使用内置 frp 服务器(yes/no, 默认 yes):" defaultFrp
defaultFrp=${defaultFrp:-yes}

echo defaultFrp: $defaultFrp

if [ "$defaultFrp" = "yes" ] || [ "$defaultFrp" = "y"  ]; then
  defaultFrp=true
  defaultSubDomain=$(cat /proc/sys/kernel/random/uuid | cut -c 1-4)
  read -p "域名前缀(默认 $defaultSubDomain):" subDomain
  subDomain=${subDomain:-$defaultSubDomain}
else
  frpcConfig="/home/pi/frpc.ini"
  read -p "frpc 配置文件地址(默认 $frpcConfig):" frpcConfig
fi

read -p "Network RC 密码(默认 networkrc):" password
password=${password:-networkrc}


echo ""
echo ""
echo ""
echo "你的设置如下"
echo "----------------------------------------"
if [ $defaultFrp = true ]; then
  echo "域名前缀: $subDomain"
  echo "Network RC 控制界面访问地址: https://${subDomain}.nrc.esonwong.com:9000";
else
  echo "使用自定义 frp 服务器"
  echo "frpc 配置文件地址: $frpcConfig"
fi
echo "Network RC 控制界面访问密码: $password"
echo ""
echo ""
echo ""


read -p "输入 ok 继续安装， 输入其他结束:" ok
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
  if test "$NETWORK_RC_BETA" = "1"; then
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
  ExecStart=/home/pi/network-rc/node /home/pi/network-rc/index.js --frpConfig \"$frpcConfig\" --password \"$password\" --subDomain \"$subDomain\"
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
  echo "安装完成"
  if [ $defaultFrp = true ]; then
    echo "域名前缀: $subDomain"
    echo "Network RC 控制界面访问地址: https://${subDomain}.nrc.esonwong.com:9000"
  else
    echo "frpc 配置文件地址: $frpcConfig"
  fi
  echo "Network RC 控制界面访问密码: $password"

else 
  exit 0
fi




