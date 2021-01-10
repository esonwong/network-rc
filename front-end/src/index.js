import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { notification } from 'antd';
import { HeartOutlined } from "@ant-design/icons";
import axios from 'axios'
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// axios.get('http://network-rc.esonwong.com:3000/afdian/api/creator/get-top-sponsors?user_id=8335f4eef7cf11ea8b1052540025c377')
//   .then(({ data: { data : { list }} }) => {
//     notification.open({
//       message: '鸣谢',
//       icon: <HeartOutlined style={{ color: '#e62662' }} />,
//       description: (<div>
//         { list.map(({ name, avatar,  }) => <> {name} - 在在爱发电的支持 <br/> </>)}
//         <p> EsonWong - 提供免费的 frp 服务 </p>
//         <a target="_blank" href="https://afdian.net/@esonwong" rel="noopener noreferrer">去爱发电支持 Network RC</a>
//       </div>)
//     });
//   })


// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
