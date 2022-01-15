import React from "react";
import { layout } from "../unit";
import { Form, Slider, Select, Input, InputNumber, Space, Switch } from "antd";

const { Option } = Select;

export default function SoundSetting({
  changeVolume,
  changeMicVolume,
  volume,
  micVolume,
  wsConnected,
  audioList,
}) {
  return (
    <Form {...layout} initialValues={{ volume, micVolume, audioList }}>
      <Form.Item label="喇叭音量" name="volume">
        <Slider
          disabled={!wsConnected}
          min={0}
          max={100}
          onAfterChange={changeVolume}
        />
      </Form.Item>
      <Form.Item label="输出设备" name="audioInterface">
        <Select disabled>
          <Option value="1">3.5mm</Option>
          <Option value="2">HDMI</Option>
        </Select>
      </Form.Item>
      <Form.Item label="麦克风灵敏度" name="micVolume">
        <Slider disabled min={0} max={100} onAfterChange={changeMicVolume} />
      </Form.Item>
      <Form.Item label="快捷播放">
        <Form.List name="audioList">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space
                  key={key}
                  style={{ display: "flex", marginBottom: 8 }}
                  align="baseline"
                >
                  <Form.Item
                    {...restField}
                    name={[name, "name"]}
                    rules={[{ required: true, message: "写个名字日后好相见" }]}
                    style={{ width: 80 }}
                  >
                    <Input placeholder="写个名字日后好相见" />
                  </Form.Item>
                  <Form.Item {...restField} name={[name, "path"]}>
                    <Input placeholder="文件在树莓派上完整路径" />
                  </Form.Item>
                  <Form.Item {...restField} name={[name, "text"]}>
                    <Input placeholder="语音播报文本" allowClear />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, "keyboard"]}
                    style={{ width: 80 }}
                    extra="⌨️ 按键"
                  >
                    <Input placeholder="键盘" prefix="⌨️" />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, "gamepadButton"]}
                    extra={
                      <span>
                        🎮
                        <a
                          href="https://gamepad-tester.com"
                          target="_blank"
                          rel="noreferrer"
                        >
                          按钮编号测试网页
                        </a>
                      </span>
                    }
                  >
                    <InputNumber min={0} max={99} />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, "showFooter"]}
                    extra="在底部显示按钮"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Space>
              ))}
            </>
          )}
        </Form.List>
      </Form.Item>
    </Form>
  );
}
