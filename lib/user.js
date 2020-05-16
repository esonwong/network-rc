const moment = require("moment");
const { join } = require("path");
const yaml = require('js-yaml');
const fs = require('fs');


module.exports = class User {
  constructor({ currentUser, onChange }) {
    const userInterval = () => {
      console.log("用户检测", moment());
      try {
        var { users } = yaml.safeLoad(fs.readFileSync(join(__dirname, '../users.yml'), 'utf8'));
        const current = users.find(({ start, end }) => moment().isBetween(start, end, "[)")) || users[0] || { name: "Eson Wong" };
        if (!currentUser || (currentUser.id !== current.id)) {
          currentUser = current;
          onChange(current)
          console.log("用户变更", current);
        }
      } catch (e) {
        console.log(e);
      }
    }
    userInterval();
    setInterval(userInterval, 60000)
  }
}