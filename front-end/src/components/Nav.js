import React from "react";
import { Menu } from "antd";
import { Link } from "@reach/router";

export default function Nav(props) {
  return (
    <Menu mode="horizontal" {...props}>
      <Menu.Item>
        <Link to="/">控制</Link>
      </Menu.Item>
      <Menu.Item>
        <Link to="setting">设置</Link>
      </Menu.Item>
      {/* <Menu.Item>
        <Link to="ai">Ai</Link>
      </Menu.Item> */}
    </Menu>
  );
}
