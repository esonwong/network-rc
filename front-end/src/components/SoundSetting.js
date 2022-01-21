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
} from "antd";
import { MinusCircleOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { useRequest } from "ahooks";

const { Option } = Select;

const {
  location: { protocol },
} = window;

export default function SoundSetting({
  changeVolume,
  changeMicVolume,
  volume,
  micVolume,
  wsConnected,
  audioList,
  saveServerConfig,
  host,
}) {
  const [form] = Form.useForm();

  const { data: currentSpeaker = {} } = useRequest(
    `${protocol}//${host}/api/speaker/current`
  );

  const { data: speakerList = [] } = useRequest(
    `${protocol}//${host}/api/speaker`
  );

  const { run: setSpeaker } = useRequest(
    () => ({
      url: `${protocol}//${host}/api/speaker/set`,
      method: "PUT",
      body: JSON.stringify({ name: form.getFieldValue("currentSpeakerName") }),
    }),
    {
      manual: true,
    }
  );

  const { run: setSpeakerVolume } = useRequest(
    () => ({
      url: `${protocol}//${host}/api/speaker/volume`,
      method: "PUT",
      body: JSON.stringify({
        name: form.getFieldValue("currentSpeakerName"),
        volume: form.getFieldValue("volume"),
      }),
    }),
    {
      manual: true,
    }
  );

  return (
    <Form
      form={form}
      {...layout}
      initialValues={{
        micVolume,
        audioList,
        currentSpeakerName: currentSpeaker?.name,
        currentSpeakerVolume: currentSpeaker?.volume || 0,
      }}
    >
      <Form.Item label="喇叭音量" name="currentSpeakerVolume">
        <Slider
          min={0}
          max={100}
          value={currentSpeaker?.volume}
          onAfterChange={setSpeakerVolume}
        />
      </Form.Item>
      <Form.Item label="输出设备" name="currentSpeakerName">
        <Select onChange={setSpeaker}>
          {speakerList.map(({ name, displayName, volume }) => (
            <Option key={name} value={name}>
              {`${displayName}(${volume}%)`}
            </Option>
          ))}
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
                        🎮 编号
                        <a
                          href="https://gamepad-tester.com"
                          target="_blank"
                          rel="noreferrer"
                        >
                          测试网页
                        </a>
                      </span>
                    }
                  >
                    <InputNumber min={0} max={99} />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, "showFooter"]}
                    extra="在底部显示"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}
              <Form.Item>
                <Space>
                  <Button
                    icon={<PlusCircleOutlined />}
                    type="dashed"
                    onClick={() => add({ showFooter: false })}
                  ></Button>
                  <Button
                    type="primary"
                    onClick={() => {
                      saveServerConfig({
                        audioList: form.getFieldValue("audioList"),
                      });
                    }}
                  >
                    保存
                  </Button>
                </Space>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Form.Item>
    </Form>
  );
}
