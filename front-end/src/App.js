import React, { Component } from 'react'
import { SyncOutlined } from '@ant-design/icons'
import { Progress, InputNumber, Form, Switch, Input, Button } from 'antd'
import './App.css';

let current;
window.addEventListener('deviceorientation', (event) => {
  const { alpha, beta, gamma } = event;
  current = { alpha, beta, gamma };
})


const layout = {
  labelCol: {
    span: 4,
  },
  wrapperCol: {
    span: 16,
  },
};

const tailLayout = {
  wrapperCol: { offset: 4, span: 16 },
};

export default class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hold: false,
      speed: 0,
      direction: 0,
      base: {
        alpha: undefined, beta: undefined, gamma: undefined
      },
      speedMaxRate: 80,
      speedReverseMaxRate: 70,
      speedZeroRate: 75,
      speedRate: 0,
      speedPercent: 0,
      directionReverse: true,
    }
  }

  componentDidMount() {
    const { changeSpeed, changeDirection } = this;
    window.addEventListener('deviceorientation', (event) => {
      changeSpeed();
      changeDirection();
    }, false);

  }

  connectWs = ({ wsAddress }) => {
    if (this.socket) {
      this.socket.close();
      this.socket = undefined;
    };



    this.socket = window.io(wsAddress);
  }

  handleHold = (hold = false) => {
    if (!hold) {
      this.socket.emit('speed rate', 0);
      this.socket.emit('direction', 0);
    }
    this.setState({
      hold,
      base: { ...current }
    })
  }

  changeSpeed = () => {
    const { hold, base: { gamma: baseGamma }, speedZeroRate, speedMaxRate, speedReverseMaxRate } = this.state;
    if (!hold) {
      this.setState({
        speedRate: 0
      })
    } else {
      const degree = current.gamma - baseGamma > 30 ? 30 : current.gamma - baseGamma;
      const speedRate = degree > 0 ? degree / 30 * (speedMaxRate - speedZeroRate) + speedZeroRate : (speedZeroRate + degree / 30 * (speedZeroRate - speedReverseMaxRate));
      this.socket.emit('speed rate', speedRate);
      this.setState({
        speedRate,
        speedPercent: degree / 30
      })
    }
  }

  changeDirection = () => {
    const { hold, base: { beta: baseBeta }, directionReverse } = this.state;
    if (!hold) {
      this.setState({
        direction: 0
      })
    } else {
      let degree = current.beta - baseBeta;
      degree = degree < -30 ? -30 : degree;
      degree = degree > 30 ? 30 : degree;
      this.socket.emit('direction', directionReverse ? -degree / 30 : degree / 30);
    }
  }

  render() {
    const { handleHold, connectWs, state: { hold, directionReverse, direction, speedReverseMaxRate, speedMaxRate, speedZeroRate, speedRate, speedPercent } } = this;
    return (
      <div className="App">
        <br />
        <Form
          {...layout}
          onFinish={connectWs}
        >
          <Form.Item
            label="连接地址"
            name="wsAddress"
            rules={[{ required: true, message: '请输入连接地址!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item {...tailLayout}>
            <Button type="primary" htmlType="submit"> 连接 </Button>
            &nbsp;
            <Button type="danger" onClick={() => { this.socket.close() }}> 断开 </Button>
          </Form.Item>
        </Form>
        <Form
          {...layout}
        >
          <Form.Item
            label="电调空占比"
          >
            <InputNumber
              value={speedRate}
              min={0}
              max={100}
              onChange={v => {
                this.socket.emit('speed rate', v);
              }}
            />
          </Form.Item>
          <Form.Item
            label="电调 0 功率 PWM 空占比"
          >
            <InputNumber
              value={speedZeroRate}
              min={0}
              max={100}
              onChange={v => {
                this.setState({
                  speedZeroRate: v
                })
              }}
            />
          </Form.Item>
          <Form.Item
            label="电调输出最大功率 PWM 空占比"
          >
            <InputNumber
              value={speedMaxRate}
              min={0}
              max={100}
              onChange={v => {
                this.setState({
                  speedMaxRate: v
                })
              }}
            />
          </Form.Item>
          <Form.Item
            label="电调反向输出最大功率 PWM 空占比"
          >
            <InputNumber
              value={speedReverseMaxRate}
              min={0}
              max={100}
              onChange={v => {
                this.setState({
                  speedReverseMaxRate: v
                })
              }}
            />
          </Form.Item>
          <Form.Item
            label="舵机反向"
          >
            <Switch
              checked={directionReverse}
              onChange={v => {
                this.setState({
                  directionReverse: v
                })
              }}
            />
          </Form.Item>
        </Form>


        <Progress className="speed" percent={Math.abs(speedPercent * 100)} showInfo={false} status={speedPercent > 0 ? "normal" : "exception"} type="dashboard" />
        <div className="direction">
          <Progress percent={0} showInfo={false} type="dashboard" gapDegree={200} />
          <Progress className="pointer" percent={100} showInfo={false} type="dashboard" gapDegree={295} style={{
            transform: `rotate(${direction}deg)`
          }} />
        </div>
        <SyncOutlined spin={hold}
          className="accelerator"
          onTouchStart={() => handleHold(true)}
          onTouchEnd={() => handleHold(false)}
        />
      </div >
    )
  }
}