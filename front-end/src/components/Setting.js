import React from "react";
import { Slider, Form, Button, Input, Select } from "antd";
import { layout, tailLayout } from "../unit";

const { Option } = Select;

export default function Setting({
  onDisconnect,
  wsConnected,
  onSubmit,
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
        <Slider min={0} max={100} tooltipVisible />
      </Form.Item>
      <Form.Item label="摄像头模式" name="cameraMode">
        <Select>
          <Option value="default">默认(低质量)</Option>
          <Option value="local">本地网络(高质量)</Option>
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
