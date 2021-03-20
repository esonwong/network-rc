import React from "react";
import { Slider, Form, Button, Input, Tabs, Space } from "antd";
import Shared from "./Shared";
import { layout, tailLayout } from "../unit";
import store from "store";
import UISetting from "./UISetting";
import ChannelSetting from "./ChannelSetting";
import BasicSetting from "./BasicSetting";
import Backup from "./Backup";
import SoundSetting from "./SoundSetting";
import Nav from "./Nav";
const { TabPane } = Tabs;

export default function Setting({
  onDisconnect,
  wsConnected,
  onSubmit,
  serverConfig,
  saveServerConfig,
  resetServerConfig,
  resetChannel,
  cameraList,
  fixedController,
  changeVolume,
  changeMicVolume,
  clearAudioTemp,
  volume,
  micVolume,
  updateVersion,
  ...form
}) {
  const clearCameraSetting = () => {
    cameraList.forEach((_, index) =>
      store.remove(`camera-${form.host}/video${index}`)
    );
    window.location.reload();
  };

  return (
    <Tabs defaultActiveKey="1" className="setting-tabs">
      <TabPane tab="连接设置" key="1">
        <Form {...layout} onFinish={onSubmit} initialValues={form}>
          <br />
          <Form.Item
            label="连接地址"
            name="host"
            rules={[{ required: true, message: "请输入连接地址!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item {...tailLayout}>
            <Space>
              <Button type="primary" htmlType="submit">
                保存并刷新
              </Button>
              <Button onClick={updateVersion}>更新版本</Button>
            </Space>
          </Form.Item>
        </Form>
        <Nav />
      </TabPane>

      <TabPane tab="基本设置" key="basic">
        <BasicSetting
          saveServerConfig={saveServerConfig}
          serverConfig={serverConfig}
        />
      </TabPane>
      <TabPane tab="UI 设置" key="ui">
        <UISetting
          resetChannel={resetChannel}
          saveServerConfig={saveServerConfig}
          serverConfig={serverConfig}
        />
      </TabPane>
      <TabPane tab="通道设置" key="channel">
        <ChannelSetting
          resetChannel={resetChannel}
          saveServerConfig={saveServerConfig}
          serverConfig={serverConfig}
        />
      </TabPane>
      <TabPane tab="摄像头设置" key="camera">
        <Form
          {...layout}
          onFinish={saveServerConfig}
          initialValues={serverConfig}
        >
          <Form.Item label="摄像头采集分辨率最大宽度" name="cameraMaxWidth">
            <Slider disabled={!wsConnected} min={0} max={1024} />
          </Form.Item>
          <Form.Item {...tailLayout}>
            <Button onClick={clearCameraSetting}>重置摄像头</Button>
          </Form.Item>
          <Form.Item {...tailLayout}>
            <Button type="primary" disabled={!wsConnected} htmlType="submit">
              保存
            </Button>
          </Form.Item>
        </Form>
      </TabPane>
      <TabPane tab="声音设置" key="sound">
        <SoundSetting
          changeVolume={changeVolume}
          changeMicVolume={changeMicVolume}
          micVolume={micVolume}
          volume={volume}
          wsConnected={wsConnected}
          saveServerConfig={saveServerConfig}
          sharedCode={serverConfig.sharedCode}
          sharedDuration={serverConfig.sharedDuration}
          sharedEndTime={serverConfig.sharedEndTime}
        />
      </TabPane>
      <TabPane tab="分享设置" key="shared">
        <Shared
          wsConnected={wsConnected}
          saveServerConfig={saveServerConfig}
          sharedCode={serverConfig.sharedCode}
          sharedDuration={serverConfig.sharedDuration}
          sharedEndTime={serverConfig.sharedEndTime}
        />
      </TabPane>
      <TabPane tab="备份" key="backup">
        <Backup
          resetServerConfig={resetServerConfig}
          saveServerConfig={saveServerConfig}
          serverConfig={serverConfig}
        />
      </TabPane>
    </Tabs>
  );
}
