import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { notification } from 'antd';
import { HeartOutlined } from "@ant-design/icons";
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

notification.open({
  message: '鸣谢',
  icon: <HeartOutlined style={{ color: '#e62662' }} />,
  description: (<div>
    - @千 - 在爱发电的支持 <br/>
    - @一生无悔 - 在爱发电的支持<br/>
    - @摩天 - 在爱发电的支持<br/>
    - @桥段 - 在爱发电的支持<br/>
    - Eson Wong - 提供免费的 frp 服务<br/>
    <a target="_blank" href="https://afdian.net/@esonwong" rel="noopener noreferrer">去爱发电支持 Network RC</a>
  </div>)
});


// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
