import React, { Component, createRef } from "react";

export default class Keybord extends Component {
  constructor(props) {
    super(props);
    this.ref = createRef();
  }

  componentDidMount() {
    this.keyboardBind();
  }

  keyboardBind = () => {
    const {
      props: {
        controller: { speed, direction }
      }
    } = this;
    window.document.addEventListener(
      "keydown",
      event => {
        const keyName = event.key;
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
      },
      false
    );
    window.document.addEventListener(
      "keyup",
      event => {
        const {
          props: {
            controller: { speed, direction }
          }
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
      },
      false
    );
  };

  render() {
    return (
      <div  tabIndex="0" ref={this.ref}>
        wads
      </div>
    );
  }
}
