import React from "react";
import { Form, Button, message, Upload } from "antd";
import { layout, tailLayout } from "../unit";
import {
  UploadOutlined,
  DownloadOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { saveAs } from "file-saver";

export default function Backup({
  serverConfig,
  resetServerConfig,
  saveServerConfig,
}) {
  const save = () => {
    var blob = new Blob([JSON.stringify(serverConfig)], {
      type: "text/plain;charset=utf-8",
    });
    saveAs(
      blob,
      `network-rc-config-backgup-${dayjs().format("YYYYMMDDTHHmmss")}.json`
    );
  };
  const load = (file) => {
    var reader = new FileReader();
    reader.onload = function (e) {
      if (reader.result) {
        saveServerConfig(JSON.parse(reader.result));
      }
    };
    reader.onerror = function (e) {
      console.error(e);
      message.error("读取备份错误");
    };

    reader.readAsText(file);
    return false;
  };
  return (
    <Form {...layout}>
      <Form.Item {...tailLayout}>
        <Button icon={<DownloadOutlined />} type="primary" onClick={save}>
          备份当前设置
        </Button>
      </Form.Item>
      <Form.Item {...tailLayout}>
        <Upload accept=".json" beforeUpload={load} showUploadList={false}>
          <Button icon={<UploadOutlined />}>恢复已保存的设置</Button>
        </Upload>
      </Form.Item>

      <Form.Item {...tailLayout}>
        <Button icon={<ReloadOutlined />} danger onClick={resetServerConfig}>
          恢复默认设置（所有设置）
        </Button>
      </Form.Item>
    </Form>
  );
}
