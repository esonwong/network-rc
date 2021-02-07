const { EventEmitter } = require("events");
const { uuid } = require("uuidv4");
const status = require("./status");

class Session extends EventEmitter {
  constructor() {
    super();
    this.list = status.config.sessionList || [];
  }

  add({ userType, sharedCode, endTime }) {
    const item = {
      createdTime: new Date().getTime(),
      id: uuid(),
      userType,
      sharedCode,
      endTime,
    };
    this.list.push(item);
    status.saveConfig({ sessionList: this.list });
    return item;
  }

  remove(id) {
    this.list = this.list.filter((i) => i.id !== id);
    status.saveConfig({ sessionList: this.list });
  }

  clearSharedCodeSession() {
    this.list = this.list.filter((i) => !i.sharedCode);
    status.saveConfig({ sessionList: this.list });
  }
}

module.exports = new Session();
