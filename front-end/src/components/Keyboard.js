import React, { Component, createRef } from "react";

export default class Keybord extends Component {
  constructor(props) {
    super(props);
    this.ref = createRef();
  }

  holdKeyList = [];

  makeTimer() {
    this.timer = setInterval(() => {
      const {
        props: {
          steeringStatus: [s0 = 0, s1 = 0],
          controller: { steering },
        },
      } = this;
      this.holdKeyList.forEach((key) => {
        switch (key) {
          case "j":
            steering(0, s0 + 0.1);
            break;
          case "l":
            steering(0, s0 - 0.1);
            break;
          case "i":
            steering(1, s1 - 0.1);
            break;
          case "k":
            steering(1, s1 + 0.1);
            break;
          case "p":
            steering(1, 0);
            steering(0, 0);
            break;
          default:
            break;
        }
      });
    }, 50);
  }

  componentDidMount() {
    this.keyboardBind();
    this.makeTimer();
  }

  componentWillUnmount() {
    const { handleKeyDown, handleKeyUp } = this;
    window.document.removeEventListener("keydown", handleKeyDown, false);
    window.document.removeEventListener("keyup", handleKeyUp, false);
    clearInterval(this.timer);
  }

  handleKeyDown = (event) => {
    if (event.target.tagName === "INPUT") return;
    const {
      props: {
        controller: { speed, direction },
        onControl,
        onEnter,
        serverConfig,
        playAudio,
      },
    } = this;
    const keyName = event.key;
    this.holdKeyList.push(keyName);

    if (keyName === "Enter") {
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

    if (keyName === "1") {
      playAudio({ path: serverConfig.audio1 });
    }

    if (keyName === "2") {
      playAudio({ path: serverConfig.audio2 });
    }

    if (keyName === "3") {
      playAudio({ path: serverConfig.audio3 });
    }

    if (keyName === "4") {
      playAudio();
    }

    onControl && onControl();
  };

  handleKeyUp = (event) => {
    if (event.target.tagName === "INPUT") return;
    const {
      props: {
        controller: { speed, direction },
        onControl,
      },
    } = this;
    const keyName = event.key;

    this.holdKeyList = this.holdKeyList.filter((key) => keyName !== key);
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
    // if (keyName === "j") {
    //   steering(0, 0);
    // }
    // if (keyName === "l") {
    //   steering(0, 0);
    // }
    // if (keyName === "i") {
    //   steering(1, 0);
    // }
    // if (keyName === "k") {
    //   steering(1, 0);
    // }

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
