import React from "react";
import { Slider, Form, Button, Input } from "antd";
import { layout, tailLayout } from "../unit";
import store from "store";


export default function Setting({
  onDisconnect,
  wsConnected,
  onSubmit,
  serverSetting,
  cameraList,
  ...form
}) {
  const clearCameraSetting = () => {
    cameraList.forEach((_, index) => store.remove(`camera-${form.wsAddress}/video${index}`));
    window.location.reload()
  }
  
  return (

    
    <Form {...layout} onFinish={onSubmit} initialValues={form}>
      <br />
      <Form.Item
        label="连接地址"
        name="wsAddress"
        rules={[{ required: true, message: "请输入连接地址!" }]}
      >
        <Input />
      </Form.Item>
      <Form.Item label="最大速度" name="speedMax">
        <Slider min={0} max={serverSetting.maxSpeed} tooltipVisible />
      </Form.Item>
      <Form.Item {...tailLayout}>
        <Button onClick={clearCameraSetting}>
          重置摄像头
        </Button>
      </Form.Item>
      <Form.Item {...tailLayout}>
        <Button type="primary" htmlType="submit">
          保存
        </Button>
      </Form.Item>
    </Form>
  );
}
