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
    if(event.target.tagName === "INPUT") return;
    const {
      props: {
        controller: { speed, direction, steering },
        onControl,
        onEnter
      },
    } = this;
    const keyName = event.key;
    if(keyName === "Enter") {
      onEnter && onEnter();
    }
    if (keyName === "w") {
      speed(1);
    }
    if (keyName === "s") {
      speed(-1);
    }
    if (keyName === "a") {
      direction(1);
    }
    if (keyName === "d") {
      direction(-1);
    }

    if (keyName === "j") {
      steering(0, 1);
    }
    if (keyName === "l") {
      steering(0, -1);
    }
    if (keyName === "i") {
      steering(1, -1);
    }
    if (keyName === "k") {
      steering(1, 1);
    }
    onControl && onControl();
  };

  handleKeyUp = (event) => {
    if(event.target.tagName === "INPUT") return;
    const {
      props: {
        controller: { speed, direction, steering },
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
    if (keyName === "j") {
      steering(0, 0);
    }
    if (keyName === "l") {
      steering(0, 0);
    }
    if (keyName === "i") {
      steering(1, 0);
    }
    if (keyName === "k") {
      steering(1, 0);
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
