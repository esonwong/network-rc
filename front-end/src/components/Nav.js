import React from "react";
import { Space } from "antd";
import {
  GithubOutlined,
  YoutubeOutlined,
  HeartOutlined,
  TwitterOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import Icon from "./Icon";

export default function Nav(props) {
  return (
    <Space
      align="center"
      size="large"
      style={{ width: "100%", justifyContent: "center" }}
    >
      <a
        href="https://network-rc.esonwong.com"
        target="_blank"
        rel="noopener noreferrer"
      >
        <HomeOutlined /> Network RC
      </a>
      <a
        href="https://twitter.com/eson000"
        target="_blank"
        rel="noopener noreferrer"
      >
        <TwitterOutlined /> Twitter
      </a>
      <a
        href="https://space.bilibili.com/96740361"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Icon type="icon-bilibili-fill" /> B站
      </a>
      <a
        href="https://www.youtube.com/channel/UCyQR6LHhhhpTFfxZo7VZddA"
        target="_blank"
        rel="noopener noreferrer"
      >
        <YoutubeOutlined /> Youtube
      </a>
      <a
        href="https://github.com/esonwong/network-rc"
        target="_blank"
        rel="noopener noreferrer"
      >
        <GithubOutlined /> Github
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
