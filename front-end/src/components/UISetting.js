import React from "react";
import { Form, Button, Input, Switch, Space, Select, Row } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { uuid } from "uuidv4";

const { Option } = Select;

const types = [
  { label: "摇杆", value: "joystick" },
  { label: "滑杆", value: "slider" },
];

export default function UISetting({ saveServerConfig, serverConfig }) {
  const [form] = Form.useForm();
  return (
    <Form form={form} onFinish={saveServerConfig} initialValues={serverConfig}>
      <Form.List name="uiComponentList">
        {(fields, { add, remove }) => (
          <>
            {fields.map((field) => (
              <Row>
                <Space key={field.key} align="baseline">
                  <Form.Item
                    {...field}
                    name={[field.name, "enabled"]}
                    fieldKey={[field.fieldKey, "enabled"]}
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="显示" unCheckedChildren="隐藏" />
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
                    <Select style={{ width: 72 }}>
                      {types.map(({ value, label }) => (
                        <Option key={value} value={value}>
                          {label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item
                    {...field}
                    label="自动归位"
                    name={[field.name, "autoReset"]}
                    fieldKey={[field.fieldKey, "autoReset"]}
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                  {form.getFieldValue([
                    "uiComponentList",
                    field.fieldKey,
                    "type",
                  ]) === "slider" && (
                    <Form.Item
                      {...field}
                      label="方向"
                      name={[field.name, "vertical"]}
                      fieldKey={[field.fieldKey, "vertical"]}
                      shouldUpdate
                      rules={[{ required: true, message: "你还没选" }]}
                    >
                      <Select style={{ width: 80 }}>
                        <Option value={false}> 横向 </Option>
                        <Option value={true}> 垂直 </Option>
                      </Select>
                    </Form.Item>
                  )}
                  <MinusCircleOutlined onClick={() => remove(field.name)} />
                </Space>
              </Row>
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
