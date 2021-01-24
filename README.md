# 树莓派网络遥控车

## 依赖
- ffmpeg: 运行前请确保树莓派上安装了 ffmpeg，安装方法 `sudo apt install ffmpeg -y`
- nodejs


## 使用教程
- 改装 RC 遥控车
  - 视频教程: [4G 网络 RC 遥控车 02 - DIY 网络控制改造教程](https://www.bilibili.com/video/BV1iK4y1r7mD)
  - 图文教程: [WiFi 网络遥控车制作教程](https://blog.esonwong.com/WiFi-4G-5G-%E7%BD%91%E7%BB%9C%E9%81%A5%E6%8E%A7%E8%BD%A6%E5%88%B6%E4%BD%9C%E6%95%99%E7%A8%8B/)
- 4G 远程控制
  - 视频教程：[4G 5G 网络 RC 遥控车03 - 无限距离远程遥控？](https://www.bilibili.com/video/BV1Xp4y1X7fa)
  - 图文教程：[网络遥控车互联网控制教程](https://blog.esonwong.com/%E7%BD%91%E7%BB%9C%E9%81%A5%E6%8E%A7%E8%BD%A6%E4%BA%92%E8%81%94%E7%BD%91%E6%8E%A7%E5%88%B6%E6%95%99%E7%A8%8B/)

## 开始

```bash
git clone https://github.com/itiwll/network-rc.git
cd network-rc/front-end
yarn # or npm install
yarn build # or npm run build
cd ..
yarn # or npm install
sudo node index.js
```

打开 `http://[你的树莓派 ip 地址]:8080`

## 使用

```bash
# 基本使用
node index.js

# 设置密码
node index.js -p password

# 启用网络穿透
node index.js -f -o 9088

# 自定义网络穿透服务器
node index.js -f -o 9088 --frpServer xxxxxxxxxx --frpServerPort xxx --frpServerToken xxxxx
```

## 接线图

![GPIO](./gpio.jpg)

## 树莓派软件下载

- [network-rc.esonwong.com](https://network-rc.esonwong.com/download)
- [github](https://github.com/itiwll/network-rc/releases)

## ToDo

- [ ] 添加远程获取 frps 配置的功能
- [ ] 一键安装脚本
- [ ] 自定义通道
  - [x] 通道设计
    - [x] 属性
      -  pin BCM code `1~27`
      - 信号类型 type `pwm|高低电平`
      - 控制方法 method `direct｜step`
      - 步进速度 stepSpeed 默认 `0.01` 每 50ms 
      - 交互控件类型
        - [ ] 滑杆 slider
        - [ ] 开关 switch
        - [ ] 摇杆 joystick
          - id
          - axis (x|y)
      - [X] 键盘
      - [ ] 手柄
        - [ ]控制类型 `default|switch`
      - 正向值 1
      - 中位值 0
      - 负向值 -1
    - [ ] 自定义交互控件
      - [ ] 位置编辑
      - [ ] 添加 摇杆
    - [ ] 自定义按键控制
- [x] 修复云台舵机的卡顿
- [x] 保存车子运行的相关状态
- [x] 检测摄像头分辨率
- [x] 修复摄像头数量检测错误 
- [x] 播放手机端录制的音频
- [x] 支持自定义证书
- [x] frp 运行添加 user 参数
- [x] ~~替换播放声音的程序~~
- [x] 更新支持者列表
- [x] 添加摄像头画面重置按钮
- [x] 更新内置 frp 配置
- [x] 为本人提供的 frp 服务启用 https
- [x] 网络连接响应时间超过 500 毫秒自动刹车
- [x] ping 值显示
- [x] 支持手柄
- [x] 网络穿透
- [x] Ai 控制(暂时移除)
- [x] 支持车辆麦克风
- [x] ~~使用 webrtc 点对点音视频控制信号传输~~（延迟高已弃用）
- [x] ~~使用 MSE~~ (延迟高已弃用）)
- [x] 支持多摄像头
  - [x] 编辑/锁定状态
  - [x] 检测摄像头数量

## 更新记录

### 0.9.30
- 支持播放声音文件（network-rc/assets/audio`[1-4]`.mp3）
- 优化交互界面
- 保存视频捕获设置

### 0.9.29
- 添加视频捕获格式和桢率选择功能

### 0.9.28
- 修复手柄错误

### 0.9.27
- 添加分享控制功能
- 更新捐赠连接

### 0.9.26
- 手柄左摇杆控制油门（适配方向盘和粉凤凰模拟器的油门）
- 优先采用 mjpeg 视频格式

### 0.9.25
- 修复打开多个控制端时，图传画面的问题
- 修复发送文本时触发语音录制


### 0.9.22
- 使用 IPv6
- 优化舵机控制
- 优化视频捕获
- 修复视频边缘

### 0.9.21
- 修复图传功能图像边缘的杂色
- 修复在移动端的 safari 不能运行控制界面的 bug
- 重写页面布局，优化 UI 交互体验

### 0.9.20
- 优化图传功能

### 0.9.18
- 优化图传功能
- 修复摄像头数量检测错误
- 重新设计设置功能

### 0.9.17
- 添加发送语音到 The car (需要穿透并开启 https，`-f -o 90xx --tsl`)
- 支持其他域名的证书 (使用`--frpServer xx.xx.xx` 参数后，在 `lib/frpc` 目录下新建 `xx.xx.xx` 文件夹，将证书文件 `fullchain.pem` 和 `privkey.pem` 放在此文件夹内)
- 优化网络延迟检测

### 0.9.15
- 优化网络波动刹车逻辑和交互
- 修复提示交互
- 修复控件被遮挡的 bug
- 增加 frp 的 user 参数 --frpServerUser xxx
- 优化运行日志

### 0.9.14
- 默认禁用 https
- 设置界面添加重置摄像头按钮
- 更新支持者列表

### 0.9.13
- 云台舵机键盘操作改为按下步进控制的方法
- 作者提供的 frp 服务支持 https
- 更新支持者列表

### 0.9.12
- 添加网络连接响应时间超过 500 毫秒自动刹车功能
### 0.9.11
- 更新内置 frps 配置
- 默认可设置的最大油门调整为 100%
### 0.9.10
- 优化油门控制，增强电调的兼容性
### 0.9.9
- 修复大量 bug
### 0.9.8
- 支持多摄像头
- websocket 连接支持车子麦克风
### 0.9.3
- 支持语音播报
- 支持发送文字语音
### 0.9.1
- 手柄功能布局
  - 右摇杆云台控制改为增量
  - 左摇杆按下改为校准重力感应
  - 0 号按钮切换电调电源
  - 1 号按钮切换车灯
> 按键布局： https://w3c.github.io/gamepad/#fig-visual-representation-of-a-standard-gamepad-layout

### 0.9.0
- 支持 webrtc 视频传输和语音对讲
- 支持 USB 摄像头和麦克风
- 支持 双轴云台
- 增加树莓派关机和重启功能
- 更新 操控 UI
  - 虚拟按钮改为滑杆
- 更新 手柄控制
  - 右摇杆改为云台控制
- 暂时移除 AI 自动驾驶
### 0.7.6
- 优化手柄按键
  - 按下左摇杆开关车灯
  - 按下右摇杆开关电调电源
  - 按下 start 开关摄像头
### 0.7.5
- 添加电调电源控制, GPIO 17(BOARD 11) 控制继电器
- 添加车灯电源控制, GPIO 27(BOARD 13) 控制继电器
### 0.7.4
- 优化对象跟踪逻辑和界面
### 0.7.1
- 添加对象跟踪 AI
### 0.7.0
- 更新 AI
### 0.6.3
- 兼容 树莓派4
- 优化网络穿透
- 优化 UI
### 0.5.8
- 支持游戏手柄
- 支持视频画面大小调整
- 支持隐藏虚拟按钮
- UI 优化
### 0.5.0
- 添加网络穿透
### 0.4.0
- 添加控制密码
- 触碰控制添加震动
### 0.3.0
- 相机模式切换
- 舵机微调

## 社群

### 微信群

交流请移步微信群，入群方法添加微信 `EsonWong_` 备注 `Network RC`

## 捐赠
![微信赞赏吗](https://blog.esonwong.com/asset/wechat-donate.jpg)

## 链接

- [作者B站主页](https://space.bilibili.com/96740361)
- [爱发电支持 Network RC](https://afdian.net/@esonwong)

## Credits

- [ws-avc-player](https://github.com/matijagaspar/ws-avc-player)
- [@clusterws/cws](https://github.com/ClusterWS/cWS)
- [rpio](https://github.com/jperkin/node-rpio)
- [rpio-pwm](https://github.com/xinkaiwang/rpio-pwm)
- [xf-tts-socket](https://github.com/jimuyouyou/xf-tts-socket)
- Eson Wong - 提供免费的 frp 服务器
