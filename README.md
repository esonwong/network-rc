# 树莓派网络遥控车

![CI](https://github.com/itiwll/network-rc/workflows/CI/badge.svg)

## 使用教程
- 视屏教程: [4G 网络 RC 遥控车 02 - DIY 网络控制改造教程](https://www.bilibili.com/video/BV1iK4y1r7mD)
- 图文教程: [WiFi 网络遥控车制作教程](https://blog.esonwong.com/WiFi-4G-5G-%E7%BD%91%E7%BB%9C%E9%81%A5%E6%8E%A7%E8%BD%A6%E5%88%B6%E4%BD%9C%E6%95%99%E7%A8%8B/)

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
- [ ] Ai 控制
- [ ] 支持语音(待定)

## 更新记录

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
- [作者微博](https://weibo.com/u/5034944416)

## Credits
- [ws-avc-player](https://github.com/matijagaspar/ws-avc-player)
- [@clusterws/cws]()
- [rpio](https://github.com/jperkin/node-rpio)
- [rpio-pwm](https://github.com/xinkaiwang/rpio-pwm)
