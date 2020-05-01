import React from "react";
import { Slider, Form, Button, Input, Select } from "antd";
import { layout, tailLayout } from "../unit";

const { Option } = Select;

export default function Setting({
  onDisconnect,
  wsConnected,
  onSubmit,
  serverSetting,
  ...form
}) {
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
      <Form.Item label="摄像头模式" name="cameraMode">
        <Select>
          <Option value="default">300p-30fps(默认)</Option>
          <Option value="300p-15fps">300p-15fps</Option>
          <Option value="300p-15fps-night">300p-15fps 夜间模式</Option>
          <Option value="480p-15fps">480p-15fps</Option>
          <Option value="600p">600p-30fps</Option>
          {/* <Option value="1080p">1080p-30fps</Option> */}
        </Select>
      </Form.Item>
      <Form.Item {...tailLayout}>
        <Button type="primary" htmlType="submit">
          保存
        </Button>
      </Form.Item>
    </Form>
  );
}
