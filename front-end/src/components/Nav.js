import React from "react";
import { Menu } from "antd";
import { Link } from "@reach/router";
import {
  GithubOutlined,
  YoutubeOutlined,
  WeiboOutlined,
  SettingOutlined,
  CarOutlined,
} from "@ant-design/icons";
import Icon from "./Icon";

export default function Nav(props) {
  return (
    <Menu mode="horizontal" {...props}>
      <Menu.SubMenu key="sub2" icon={<CarOutlined />} title="AI">
        <Menu.Item>
          <Link to={`${process.env.PUBLIC_URL}/ai/learn/sample`}>机器学习</Link>
        </Menu.Item>
        <Menu.Item>
          <Link to={`${process.env.PUBLIC_URL}/ai/coco-ssd`}>目标追踪</Link>
        </Menu.Item>
      </Menu.SubMenu>
      <Menu.Item>
        <Link to={`${process.env.PUBLIC_URL}/setting`}>
          <SettingOutlined /> 设置
        </Link>
      </Menu.Item>

      <Menu.Item>
        <a
          href="https://space.bilibili.com/96740361"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon type="icon-bilibili-fill" /> B站 EsonWong
        </a>
      </Menu.Item>
      <Menu.Item>
        <a
          href="https://www.youtube.com/channel/UCyQR6LHhhhpTFfxZo7VZddA"
          target="_blank"
          rel="noopener noreferrer"
        >
          <YoutubeOutlined /> Youtube EsonWong
        </a>
      </Menu.Item>
      <Menu.Item>
        <a
          href="https://github.com/itiwll/network-rc"
          target="_blank"
          rel="noopener noreferrer"
        >
          <GithubOutlined /> Github Network-rc
        </a>
      </Menu.Item>
      <Menu.Item>
        <a
          href="https://weibo.com/u/5034944416"
          target="_blank"
          rel="noopener noreferrer"
        >
          <WeiboOutlined /> 微博 Eson_Wong
        </a>
      </Menu.Item>
      {/* <Menu.Item>
        <Link to="ai">Ai</Link>
      </Menu.Item> */}
    </Menu>
  );
}
