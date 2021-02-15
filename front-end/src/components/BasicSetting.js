import React from "react";
import { Form, Button, Select } from "antd";
import { layout, tailLayout } from "../unit";

const { Option } = Select;

export default function UISetting({ saveServerConfig, serverConfig }) {
  return (
    <Form {...layout} onFinish={saveServerConfig} initialValues={serverConfig}>
      <Form.Item label="油门通道" name={["specialChannel", "speed"]}>
        <Select>
          {serverConfig.channelList
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
          {serverConfig.channelList
            .filter(({ type }) => type === "pwm")
            .map(({ id, name, pin }) => (
              <Option value={id} key={id}>
                {" "}
                {name}(GPIO:{pin}){" "}
              </Option>
            ))}
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
