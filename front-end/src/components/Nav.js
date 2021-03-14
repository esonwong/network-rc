import React from "react";
import { Space } from "antd";
import {
  GithubOutlined,
  YoutubeOutlined,
  HeartOutlined,
} from "@ant-design/icons";
import Icon from "./Icon";

export default function Nav(props) {
  return (
    <Space align="center" style={{ width: "100%", justifyContent: "center" }}>
      <a
        href="https://space.bilibili.com/96740361"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Icon type="icon-bilibili-fill" /> B站 EsonWong
      </a>
      <a
        href="https://www.youtube.com/channel/UCyQR6LHhhhpTFfxZo7VZddA"
        target="_blank"
        rel="noopener noreferrer"
      >
        <YoutubeOutlined /> Youtube EsonWong
      </a>
      <a
        href="https://github.com/itiwll/network-rc"
        target="_blank"
        rel="noopener noreferrer"
      >
        <GithubOutlined /> Github Network-rc
      </a>
      <a
        href="https://blog.esonwong.com/donate/"
        target="_blank"
        rel="noopener noreferrer"
      >
        <HeartOutlined /> 请我喝杯咖啡吧！
      </a>
    </Space>
  );
}
