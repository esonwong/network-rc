import React from "react";
import { Slider, Form, Button, Input, Tabs, Switch } from "antd";
import { layout, tailLayout } from "../unit";
import store from "store";
const { TabPane } = Tabs;

export default function Setting({
  onDisconnect,
  wsConnected,
  onSubmit,
  serverConfig,
  saveServerConfig,
  cameraList,
  fixedController,
  ...form
}) {
  const clearCameraSetting = () => {
    cameraList.forEach((_, index) => store.remove(`camera-${form.wsAddress}/video${index}`));
    window.location.reload()
  }

  return (
    <Tabs defaultActiveKey="1">
      <TabPane tab="连接设置" key="1">
        <Form {...layout} onFinish={onSubmit} initialValues={form}>
          <br />
          <Form.Item
            label="连接地址"
            name="wsAddress"
            rules={[{ required: true, message: "请输入连接地址!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item {...tailLayout}>
            <Button type="primary" htmlType="submit">
              保存并刷新
          </Button>
          </Form.Item>
        </Form>
      </TabPane>
      <TabPane tab="基本设置" key="2">
        <Form {...layout} onFinish={saveServerConfig} initialValues={serverConfig}>
          <Form.Item label="最大速度" name="maxSpeed">
            <Slider disabled={!wsConnected} min={0} max={100} />
          </Form.Item>

          <Form.Item label="自动刹车的延迟时间" name="autoLockTime">
            <Slider disabled={!wsConnected} min={500} max={5000} />
          </Form.Item>
          <Form.Item valuePropName="checked" label="手柄左摇杆控制油门" name="enabledAxis1Controal">
            <Switch disabled={!wsConnected} />
          </Form.Item>
          <Form.Item {...tailLayout}>
            <Button type="primary" disabled={!wsConnected} htmlType="submit">
              保存
          </Button>
          </Form.Item>
        </Form>
      </TabPane>
      <TabPane tab="通道设置" key="3">
      </TabPane>
      <TabPane tab="摄像头设置" key="camera">
        <Form {...layout} onFinish={saveServerConfig} initialValues={serverConfig}>
          <Form.Item label="摄像头采集分辨率最大宽度" name="cameraMaxWidth">
            <Slider disabled={!wsConnected} min={0} max={1920} />
          </Form.Item>
          <Form.Item {...tailLayout}>
            <Button onClick={clearCameraSetting}>
              重置摄像头
          </Button>
          </Form.Item>
          <Form.Item {...tailLayout}>
            <Button type="primary" disabled={!wsConnected} htmlType="submit">
              保存
          </Button>
          </Form.Item>
        </Form>
      </TabPane>
    </Tabs>


  );
}
