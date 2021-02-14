import React from "react";
import { uuid } from "uuidv4";
import Qrcode from "qrcode.react";
import { Form, Switch, Input, message, Button, InputNumber } from "antd";
import { layout } from "../unit";
import copy from "copy-to-clipboard";
import { useUpdateEffect } from "ahooks";

function Shared({
  saveServerConfig,
  sharedCode,
  sharedDuration = 10 * 1000 * 60,
  sharedEndTime,
  wsConnected,
}) {
  const onChange = function (value) {
    saveServerConfig({ sharedCode: value ? uuid() : false });
  };

  const sharedUrl = sharedCode
    ? `${window.location.origin}/login?shared-code=${sharedCode}`
    : "";

  const copyLink = function () {
    if (sharedUrl) {
      copy(sharedUrl);
      message.success("分享地址已复制 🤩 ！");
    }
  };
  useUpdateEffect(copyLink, [sharedCode]); // you can include deps array if necessary

  return (
    <Form {...layout}>
      <Form.Item label="开启">
        <Switch
          disabled={!wsConnected}
          checkedChildren={`${
            sharedEndTime
              ? ((sharedEndTime - new Date().getTime()) / 1000).toFixed(0)
              : sharedDuration / 1000
          }s`}
          onChange={onChange}
          checked={sharedCode ? true : false}
        />
      </Form.Item>
      <Form.Item label="分享时间">
        <InputNumber
          min={60}
          defaultValue={sharedDuration / 1000}
          step={60}
          onChange={(v) => {
            if (isNaN(v * 1000)) return;
            saveServerConfig({ sharedDuration: v * 1000 });
          }}
        />
        秒
      </Form.Item>
      <Form.Item label="分享控制地址">
        <Input
          disabled
          value={sharedUrl}
          suffix={
            sharedUrl ? (
              <Button type="link" onClick={copyLink}>
                复制
              </Button>
            ) : undefined
          }
        />
      </Form.Item>
      <Form.Item label="分享二维码">
        <Qrcode value={sharedUrl || "https://blog.esonwong.com/donate/"} />
      </Form.Item>
    </Form>
  );
}

export default Shared;
