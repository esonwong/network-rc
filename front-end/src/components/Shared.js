import React from 'react'
import { uuid } from 'uuidv4';
import Qrcode from 'qrcode.react';
import { Form, Switch, Input, message, Button } from "antd";
import { layout } from "../unit";
import copy from 'copy-to-clipboard';
import { useUpdateEffect } from '@umijs/hooks';

function Shared({ saveServerConfig, sharedCode, wsConnected }) {

  const onChange = function (value) {
    saveServerConfig({ sharedCode: value ? uuid() : false })
  }

  const sharedUrl = sharedCode ? `${window.location.origin}/login?shared-code=${sharedCode}` : ''

  const copyLink = function(){
    if (sharedUrl) { copy(sharedUrl); message.success('分享地址已复制 🤩 ！') }
  }
  useUpdateEffect( copyLink, [sharedCode]); // you can include deps array if necessary


  return (
    <Form {...layout}>
      <Form.Item label="开启">
        <Switch disabled={!wsConnected} onChange={onChange} checked={sharedCode ? true : false} />
      </Form.Item>
      <Form.Item label="分享控制地址">
        <Input disabled value={sharedUrl}  
          suffix={sharedUrl ? <Button type="link" onClick={copyLink}>复制</Button> : undefined}
        />
      </Form.Item>
      <Form.Item label="分享二维码">
        <Qrcode value={sharedUrl || "https://blog.esonwong.com/donate/"} />
      </Form.Item>
    </Form>
  )
}

export default Shared
