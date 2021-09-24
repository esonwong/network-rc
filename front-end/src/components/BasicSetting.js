import React from "react";
import { Form, Button, Select, Slider } from "antd";
import { layout, tailLayout } from "../unit";

const { Option } = Select;

export default function UISetting({ saveServerConfig, serverConfig }) {
  const { channelList = [] } = serverConfig;
  return (
    <Form {...layout} onFinish={saveServerConfig} initialValues={serverConfig}>
      <Form.Item
        label="油门通道"
        name={["specialChannel", "speed"]}
        extra="自动刹车需要正确设置此通道"
      >
        <Select>
          {channelList
            .filter(({ type }) => type === "pwm")
            .map(({ id, name, pin }) => (
              <Option value={id} key={id}>
                {" "}
                {name}(GPIO:{pin}){" "}
              </Option>
            ))}
        </Select>
      </Form.Item>
      <Form.Item label="方向通道" name={["specialChannel", "direction"]}>
        <Select>
          {channelList
            .filter(({ type }) => type === "pwm")
            .map(({ id, name, pin }) => (
              <Option value={id} key={id}>
                {" "}
                {name}(GPIO:{pin}){" "}
              </Option>
            ))}
        </Select>
      </Form.Item>
      <Form.Item
        label="自动刹车延迟阀值"
        name="autoLockTime"
        extra="毫秒，网络延迟超过设定值时刹车"
      >
        <Slider max={3000} />
      </Form.Item>
      <Form.Item
        label="延迟刹车时长"
        name="brakeTime"
        extra="毫秒，设为 0 时仅复位通道"
      >
        <Slider max={1000} />
      </Form.Item>
      <Form.Item {...tailLayout}>
        <Button type="primary" htmlType="submit">
          保存
        </Button>
      </Form.Item>
    </Form>
  );
}
