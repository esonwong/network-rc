import React from "react";
import { layout } from "../unit";
import { Form, Slider, Select } from "antd";

const { Option } = Select;

export default function SoundSetting({
  changeVolume,
  changeMicVolume,
  volume,
  micVolume,
  wsConnected,
}) {
  return (
    <Form {...layout} initialValues={{ volume, micVolume }}>
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
    </Form>
  );
}
