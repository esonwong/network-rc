import React from "react";
import { Form, Button, Input, Switch, Space, Select } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { layout } from "../unit";
import { uuid } from "uuidv4";

const { Option } = Select;

const types = [
  { label: "摇杆", value: "joystick" },
  { label: "滑杆", value: "slider" },
];

export default function UISetting({
  resetChannel,
  saveServerConfig,
  serverConfig,
}) {
  const [form] = Form.useForm();
  return (
    <Form form={form} onFinish={saveServerConfig} initialValues={serverConfig}>
      <Form.List name="uiComponentList">
        {(fields, { add, remove }) => (
          <>
            {fields.map((field) => (
              <Space key={field.key} align="baseline">
                <Form.Item
                  {...field}
                  name={[field.name, "enabled"]}
                  fieldKey={[field.fieldKey, "enabled"]}
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
                <Form.Item
                  {...field}
                  label="名称"
                  name={[field.name, "name"]}
                  fieldKey={[field.fieldKey, "name"]}
                >
                  <Input style={{ width: 80 }} />
                </Form.Item>
                <Form.Item
                  {...field}
                  label="类型"
                  name={[field.name, "type"]}
                  fieldKey={[field.fieldKey, "type"]}
                  rules={[{ required: true, message: "你还没选" }]}
                >
                  <Select>
                    {types.map(({ value, label }) => (
                      <Option key={value} value={value}>
                        {label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  {...field}
                  label="方向"
                  name={[field.name, "vertical"]}
                  fieldKey={[field.fieldKey, "vertical"]}
                >
                  <Select
                    style={{ width: 80 }}
                    disabled={
                      "slider" !==
                      form.getFieldValue([
                        "uiComponentList",
                        field.fieldKey,
                        "type",
                      ])
                    }
                  >
                    <Option value={false}> 横向 </Option>
                    <Option value={true}> 垂直 </Option>
                  </Select>
                </Form.Item>
                <MinusCircleOutlined onClick={() => remove(field.name)} />
                {form.getFieldValue([`uiComponentList`, "0", "type"])}
              </Space>
            ))}

            <Form.Item>
              <Button
                type="dashed"
                onClick={() =>
                  add({
                    id: uuid(),
                    enabled: true,
                  })
                }
                block
                icon={<PlusOutlined />}
              >
                添加控制组件
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>
      <Form.Item>
        <Button type="primary" htmlType="submit">
          保存
        </Button>
      </Form.Item>
    </Form>
  );
}
