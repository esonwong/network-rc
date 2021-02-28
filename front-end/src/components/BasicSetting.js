import React from "react";
import { Form, Button, Select, Slider } from "antd";
import { layout, tailLayout } from "../unit";

const { Option } = Select;

export default function UISetting({ saveServerConfig, serverConfig }) {
  const { channelList = [] } = serverConfig;
  return (
    <Form {...layout} onFinish={saveServerConfig} initialValues={serverConfig}>
      <Form.Item label="油门通道" name={["specialChannel", "speed"]}>
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
      <Form.Item label="自动刹车延迟阀值" name="autoLockTime">
        <Slider max={3000} />
      </Form.Item>
      <Form.Item {...tailLayout}>
        <Button type="primary" htmlType="submit">
          保存
        </Button>
      </Form.Item>
    </Form>
  );
}
