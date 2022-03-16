import React from "react";
import { Outlet } from "react-router-dom";
import { Layout, Menu } from "antd";

const { Header, Content, Footer } = Layout;

export default function Setting() {
  return (
    <Layout className="layout">
      <Header>
        <Menu mode="horizontal">
          <Menu.Item>111</Menu.Item>;
        </Menu>
      </Header>
      <Content style={{ padding: "0 50px" }}>
        <Outlet />
      </Content>
      <Footer style={{ textAlign: "center" }}>@Eson Wong</Footer>
    </Layout>
  );
}
