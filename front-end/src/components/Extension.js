import React from "react";
import { layout } from "../unit";
import {
  Form,
  Slider,
  Select,
  Input,
  InputNumber,
  Space,
  Switch,
  Button,
  Radio,
  Upload,
} from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { useRequest } from "ahooks";

const {
  location: { protocol },
} = window;

export default function Extension({ host }) {
  const [form] = Form.useForm();

  const normFile = (e) => {
    console.log("Upload event:", e);
    if (Array.isArray(e)) {
      return e;
    }
    return e && e.fileList;
  };

  const { run: onSubmit } = useRequest(
    () => ({
      url: `${protocol}//${host}/api/speaker/set`,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: form.getFieldValue("currentSpeakerName") }),
    }),
    {
      manual: true,
    }
  );

  return (
    <Form
      {...layout}
      onFinish={onSubmit}
      initialValues={{
        language: "bash",
        type: "script",
        autSttart: true,
        interval: 0,
      }}
      form={form}
    >
      <Form.Item label="类型" name="language">
        <Radio.Group>
          <Radio.Button value="bash">Bash</Radio.Button>
          <Radio.Button value="python">Python3</Radio.Button>
          <Radio.Button value="node">Node</Radio.Button>
        </Radio.Group>
      </Form.Item>
      <Form.Item label="类型" name="type">
        <Radio.Group>
          <Radio.Button value="script">脚本</Radio.Button>
          <Radio.Button value="file">文件</Radio.Button>
        </Radio.Group>
      </Form.Item>

      <Form.Item
        label="随 Network RC 启动"
        name="autSttart"
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>

      <Form.Item label="间隔执行时间" name="interval" extra="0 则不会执行">
        <InputNumber min={0} /> 秒
      </Form.Item>

      <Form.Item wrapperCol={{ span: 24 }} shouldUpdate>
        {() =>
          form.getFieldValue("type") === "script" ? (
            <Form.Item label="脚本" name="script" {...layout}>
              <Input.TextArea rows={4} />
            </Form.Item>
          ) : (
            <Form.Item label="文件" {...layout}>
              <Form.Item
                name="dragger"
                valuePropName="fileList"
                getValueFromEvent={normFile}
                noStyle
              >
                <Upload.Dragger
                  name="files"
                  action={`${protocol}//${host}api/upload`}
                  maxCount={1}
                >
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">
                    Click or drag file to this area to upload
                  </p>
                  <p className="ant-upload-hint">
                    Support for a single or bulk upload.
                  </p>
                </Upload.Dragger>
              </Form.Item>
            </Form.Item>
          )
        }
      </Form.Item>
      <Form.Item wrapperCol={{ offset: 6 }}>
        <Button type="primary" htmlType="submit">
          添加
        </Button>
      </Form.Item>
    </Form>
  );
}
