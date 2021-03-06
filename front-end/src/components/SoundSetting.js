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
  micVolume,
  audioList,
  saveServerConfig,
  host,
}) {
  const [form] = Form.useForm();

  const { data: currentSpeaker = {} } = useRequest(
    `${protocol}//${host}/api/speaker/current`,
    {
      onSuccess: () => {
        form.resetFields();
      },
    }
  );

  const { data: speakerList = [] } = useRequest(
    `${protocol}//${host}/api/speaker`
  );

  const { run: setSpeaker } = useRequest(
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

  const { run: setSpeakerVolume } = useRequest(
    () => ({
      url: `${protocol}//${host}/api/speaker/volume`,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: form.getFieldValue("currentSpeakerName"),
        volume: form.getFieldValue("currentSpeakerVolume"),
      }),
    }),
    {
      manual: true,
    }
  );

  const { data: currentMic = {} } = useRequest(
    `${protocol}//${host}/api/mic/current`,
    {
      onSuccess: () => {
        form.resetFields();
      },
    }
  );

  const { data: micList = [] } = useRequest(`${protocol}//${host}/api/mic`);

  const { run: setMic } = useRequest(
    () => ({
      url: `${protocol}//${host}/api/mic/set`,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: form.getFieldValue("currentMicName") }),
    }),
    {
      manual: true,
    }
  );

  const { run: setMicVolume } = useRequest(
    () => ({
      url: `${protocol}//${host}/api/mic/volume`,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: form.getFieldValue("currentMicName"),
        volume: form.getFieldValue("currentMicVolume"),
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
        audioList,
        currentSpeakerName: currentSpeaker?.name,
        currentSpeakerVolume: currentSpeaker?.volume || 0,
        currentMicName: currentMic?.name,
        currentMicVolume: currentMic?.volume || 0,
      }}
    >
      <Form.Item label="????????????" name="currentSpeakerVolume">
        <Slider
          min={0}
          max={100}
          value={currentSpeaker?.volume}
          onAfterChange={setSpeakerVolume}
        />
      </Form.Item>
      <Form.Item label="????????????" name="currentSpeakerName">
        <Select onChange={setSpeaker}>
          {speakerList.map(({ name, displayName, volume }) => (
            <Option key={name} value={name}>
              {`${displayName}(${volume}%)`}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item label="???????????????" name="currentMicVolume">
        <Slider
          min={0}
          max={100}
          value={micVolume}
          onAfterChange={setMicVolume}
        />
      </Form.Item>
      <Form.Item label="???????????????" name="currentMicName">
        <Select onChange={setMic}>
          {micList.map(({ name, displayName, volume }) => (
            <Option key={name} value={name}>
              {`${displayName}(${volume}%)`}
            </Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item label="????????????">
        <Form.List name="audioList">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space
                  key={key}
                  style={{ display: "flex", marginBottom: 8 }}
                  align="baseline"
                >
                  <Form.Item {...restField} name={[name, "type"]} extra="??????">
                    <Select onChange={setSpeaker}>
                      <Option key="audio" value="audio">
                        ??????
                      </Option>
                      <Option key="test" value="text">
                        ??????
                      </Option>
                      <Option key="stop" value="stop">
                        ??????
                      </Option>
                    </Select>
                  </Form.Item>

                  {form.getFieldValue(["audioList", name, "type"]) ===
                    "audio" && (
                    <>
                      <Form.Item
                        {...restField}
                        name={[name, "name"]}
                        rules={[
                          { required: true, message: "???????????????????????????" },
                        ]}
                        style={{ width: 80 }}
                        extra="??????"
                      >
                        <Input placeholder="???????????????????????????" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, "path"]}
                        extra="?????????????????????????????????"
                      >
                        <Input placeholder="????????????" />
                        {/* <Upload /> */}
                      </Form.Item>
                    </>
                  )}

                  {form.getFieldValue(["audioList", name, "type"]) ===
                    "text" && (
                    <>
                      <Form.Item
                        {...restField}
                        name={[name, "text"]}
                        extra="??????????????????"
                      >
                        <Input placeholder="??????????????????" allowClear />
                      </Form.Item>
                    </>
                  )}

                  <Form.Item
                    {...restField}
                    name={[name, "keyboard"]}
                    style={{ width: 80 }}
                    extra="?????? ??????"
                  >
                    <Input placeholder="??????" prefix="??????" />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, "gamepadButton"]}
                    extra={
                      <span>
                        ???? ??????
                        <a
                          href="https://gamepad-tester.com"
                          target="_blank"
                          rel="noreferrer"
                        >
                          ????????????
                        </a>
                      </span>
                    }
                  >
                    <InputNumber min={0} max={99} />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, "showFooter"]}
                    extra="???????????????"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                  <Button
                    icon={<MinusCircleOutlined />}
                    type="dashed"
                    onClick={() => remove(name)}
                  ></Button>
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
                    ??????
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
