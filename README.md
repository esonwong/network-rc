# 树莓派网络遥控车

## 依赖
- ffmpeg: 运行前请确保树莓派上安装了 ffmpeg，安装方法 `sudo apt install ffmpeg -y`


## 使用教程
- 改装 RC 遥控车
  - 视频教程: [4G 网络 RC 遥控车 02 - DIY 网络控制改造教程](https://www.bilibili.com/video/BV1iK4y1r7mD)
  - 图文教程: [WiFi 网络遥控车制作教程](https://blog.esonwong.com/WiFi-4G-5G-%E7%BD%91%E7%BB%9C%E9%81%A5%E6%8E%A7%E8%BD%A6%E5%88%B6%E4%BD%9C%E6%95%99%E7%A8%8B/)
- 4G 远程控制
  - 视频教程：[4G 5G 网络 RC 遥控车03 - 无限距离远程遥控？](https://www.bilibili.com/video/BV1Xp4y1X7fa)
  - 图文教程：[网络遥控车互联网控制教程](https://blog.esonwong.com/%E7%BD%91%E7%BB%9C%E9%81%A5%E6%8E%A7%E8%BD%A6%E4%BA%92%E8%81%94%E7%BD%91%E6%8E%A7%E5%88%B6%E6%95%99%E7%A8%8B/)

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

## ToDo
- [x] 支持手柄
- [x] 网络穿透
- [x] Ai 控制
- [x] 支持语音
- [x] 使用 webrtc 点对点音视频控制信号传输
- [x] 掉线、大延迟自动处理
- [ ] 支持双摄像头

## 更新记录
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


## 链接
- [作者B站主页](https://space.bilibili.com/96740361)

## Credits
- [ws-avc-player](https://github.com/matijagaspar/ws-avc-player)
- [@clusterws/cws]()
- [rpio](https://github.com/jperkin/node-rpio)
- [rpio-pwm](https://github.com/xinkaiwang/rpio-pwm)
