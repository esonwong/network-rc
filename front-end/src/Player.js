import React, { Component, createRef } from "react";

export default class Player extends Component {
  constructor(props) {
    super(props);

    this.ref = createRef();
  }

  componentDidMount() {
    const { setCanvasRef } = this.props;
    this.ref.current.appendChild(this.wsavc.AvcPlayer.canvas);
    setCanvasRef && setCanvasRef(this.wsavc.AvcPlayer.canvas);

  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.disabled !== this.props.disabled) {
      if (nextProps.disabled) {
        this.disconnect();
      } else {
        this.connect();
      }
    }
  }

  connect() {
    if (!this.wsavc) return;
    this.wsavc.connect(
      `${window.location.protocol === "https:" ? "wss" : "ws"}://${
        window.location.host
      }`
    );
        this.wsavc.connect("ws://localhost:8080");
    // this.wsavc.connect(
    //   `${window.location.protocol === "https:" ? "wss" : "ws"}://${
    //     window.location.host
    //   }`
    // );
  }

  disconnect() {
    if (this.wsavc) {
      this.wsavc.disconnect();
      this.wsavc = undefined;
    }
  }

  render() {
    return (
      <div className="player" ref={this.ref}>
        {/* <canvas className="canvas" ref={this.setCanvasRef}></canvas> */}
      </div>
    );
  }
}
