import React, { Component, createRef } from "react";

export default class Keybord extends Component {
  constructor(props) {
    super(props);
    this.ref = createRef();
  }

  componentDidMount() {
    this.keyboardBind();
  }

  componentWillUnmount() {
    const { handleKeyDown, handleKeyUp } = this;
    window.document.removeEventListener("keydown", handleKeyDown, false);
    window.document.removeEventListener("keyup", handleKeyUp, false);
  }

  handleKeyDown = (event) => {
    const {
      props: {
        controller: { speed, direction },
        onControl,
        forwardPower,
        backwardPower,
        directionReverse,
        speedReverse,
      },
    } = this;
    const keyName = event.key;
    if (keyName === "w") {
      speed(((1 * forwardPower) / 100) * (speedReverse ? -1 : 1));
    }
    if (keyName === "s") {
      speed(((-1 * backwardPower) / 100) * (speedReverse ? -1 : 1));
    }
    if (keyName === "a") {
      direction(directionReverse ? -1 : 1);
    }
    if (keyName === "d") {
      direction(directionReverse ? 1 : -1);
    }
    onControl && onControl();
  };

  handleKeyUp = (event) => {
    const {
      props: {
        controller: { speed, direction },
        onControl,
      },
    } = this;
    const keyName = event.key;
    if (keyName === "w") {
      speed(0);
    }
    if (keyName === "s") {
      speed(0);
    }
    if (keyName === "a") {
      direction(0);
    }
    if (keyName === "d") {
      direction(0);
    }
    onControl && onControl();
  };

  keyboardBind = () => {
    const { handleKeyDown, handleKeyUp } = this;
    window.document.addEventListener("keydown", handleKeyDown, false);
    window.document.addEventListener("keyup", handleKeyUp, false);
  };

  render() {
    return <div></div>;
  }
}
