import React, { Component } from 'react'
import { SyncOutlined } from '@ant-design/icons'
import { Progress } from 'antd'
import './App.css';

let current;
window.addEventListener('deviceorientation', (event) => {
  const { alpha, beta, gamma } = event;
  current = { alpha, beta, gamma };
})

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
    }
  }

  componentDidMount() {
    const { changeSpeed, changeDirection } = this;
    window.addEventListener('deviceorientation', (event) => {
      changeSpeed();
      changeDirection();
    }, false);

  }

  handleHold = (hold = false) => {
    this.setState({
      hold,
      base: { ...current }
    })
  }

  changeSpeed = () => {
    const { hold, base: { gamma: baseGamma } } = this.state;
    if (!hold) {
      this.setState({
        speed: 0
      })
    } else {
      const degree = current.gamma - baseGamma > 30 ? 30 : current.gamma - baseGamma;
      const speed = degree / 30 * 100;
      this.setState({
        speed
      })
    }
  }

  changeDirection = () => {
    const { hold, base: { beta: baseBeta } } = this.state;
    if (!hold) {
      this.setState({
        direction: 0
      })
    } else {
      let degree = current.beta - baseBeta;
      degree = degree < -30 ? -30 : degree;
      degree = degree > 30 ? 30 : degree;
      const direction = degree / 30 * 60;
      this.setState({
        direction
      })
    }
  }

  render() {
    const { handleHold, state: { hold, speed, direction } } = this;
    return (
      <div className="App">

        direction:{direction}, speed: {speed}
        <Progress className="speed" percent={speed} showInfo={false} type="dashboard" />
        <Progress className="direction" percent={0} showInfo={false} type="dashboard" gapDegree={200} />
        <Progress className="direction" percent={100} showInfo={false} type="dashboard" gapDegree={295} style={{
          transform: `rotate(${direction}deg)`
        }} />
        <SyncOutlined spin={hold}
          className="accelerator"
          onTouchStart={() => handleHold(true)}
          onTouchEnd={() => handleHold(false)}
        />
      </div>
    )
  }
}