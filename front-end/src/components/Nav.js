import React from "react";
import { Menu } from "antd";
import { Link } from "@reach/router";

export default function Nav(props) {
  return (
    <Menu mode="horizontal" {...props}>
      {/* <Menu.Item> */}
        {/* <Link to="/">控制</Link> */}
      {/* </Menu.Item> */}
      <Menu.Item>
        <Link to="setting">设置</Link>
      </Menu.Item>

      <Menu.Item>
        <a href="https://space.bilibili.com/96740361" target="_blank" rel="noopener noreferrer">up 主B站主页</a>
      </Menu.Item>
      {/* <Menu.Item>
        <Link to="ai">Ai</Link>
      </Menu.Item> */}
    </Menu>
  );
}
