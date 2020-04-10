import React from "react";
import { Menu } from "antd";
import { Link } from "@reach/router";
import { GithubOutlined, YoutubeOutlined, WeiboOutlined, SettingOutlined } from "@ant-design/icons";

export default function Nav(props) {
  return (
    <Menu mode="horizontal" {...props}>
      {/* <Menu.Item> */}
      {/* <Link to="/">控制</Link> */}
      {/* </Menu.Item> */}
      <Menu.Item>
        <Link to="setting"><SettingOutlined /> 设置</Link>
      </Menu.Item>

      <Menu.Item>
        <a
          href="https://space.bilibili.com/96740361"
          target="_blank"
          rel="noopener noreferrer"
        >
          <YoutubeOutlined /> up主EsonWong B站主页
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
