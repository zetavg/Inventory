const path = require('path');

module.exports = {
  ...require(path.join(__dirname, 'base.js')),
  env: { node: true },
};
