import React from "react";
import { Slider, Form, Button, Input, Tabs, Switch } from "antd";
import { layout, tailLayout } from "../unit";

export default function ChannelSetting({ resetChannel }) {
  return (
    <div>
      <Form {...layout}>
        <br />
        <Form.Item {...tailLayout}>
          <Button type="danger" onClick={resetChannel}>
            恢复默认通道设置
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
