# 常见问题

## 摄像头画面为什么是黑的？

在 Network RC 不支持的树莓派新版本系统上，摄像头画面会是黑的。

解决办法：使用[安装教程](./guide.md)推荐的树莓派系统。

## 摄像头分辨率为什么是最大是 640x480？

经过测试，分辨率再高的时候，图传的延迟有较大影响。目前限制最大宽度为 640。

## 树莓派 Act Led 灯指示 Network RC 运行状态

- 慢速闪烁：Network RC 已启动
- 中速闪烁：Network RC 已网络穿透成功
- 快速闪烁：Network RC 运行错误或者网络穿透失败
- 长亮状态：控制端已打开

## 蓝牙音响没用我该怎么做？

- 先用一键安装脚安装 Network RC
- **不要**打开树莓派系统的桌面或者 VNC。树莓派的桌面的音频和 Network RC 的音频有**冲突**。不要安装带桌面的树莓派系统。
- 使用命令行连接蓝牙音响

  1.  打开蓝牙控制程序

      ```bash
      sudo bluetoothctl
      default-agent
      ```

  2.  打开蓝牙音响配对模式
  3.  搜索蓝牙音响

      ```bash
      scan on
      ```

  4.  找到蓝牙音响的 MAC 地址，然后停止搜索

      ```bash
      scan off
      ```

  5.  信任蓝牙音响

      ```bash
      trust XX:XX:XX:XX:XX:XX
      ```

  6.  配对蓝牙音响

      ```bash
      pair XX:XX:XX:XX:XX:XX
      ```

  7.  连接蓝牙音响

      ```bash
      connect XX:XX:XX:XX:XX:XX
      ```

  8.  退出蓝牙控制程序
      ```bash
      exit
      ```
  9.  重启树莓派
      ```bash
      reboot
      ```

- 先开 Network RC 控制界面，再打开蓝牙音响电源。

## 怎么安装旧版本的 Network RC？

> ⚠️ 注意：太旧版本的 Network RC 不支持一键安装

查看版本列表 <https://download.esonwong.com/network-rc/> ，找到版本表标识，`x.y.z` 或 `vx.y.z`。

```shell
NETWORK_RC_VERSION=2.5.9 bash <(curl -sL https://download.esonwong.com/network-rc/install.sh)

# or

NETWORK_RC_VERSION=v2.5.12 bash <(curl -sL https://download.esonwong.com/network-rc/install.sh)

```

## 怎么安装 beta 版本？

```shell
NETWORK_RC_BETA=1 bash <(curl -sL https://download.esonwong.com/network-rc/install.sh)
```

## 怎么查看日志?

```shell
tail -n 100 -f ~/.network-rc/logs/all.log
```
