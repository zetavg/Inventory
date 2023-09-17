const path = require('path');

module.exports = {
  root: true,
  extends: '@react-native-community',
  plugins: ['simple-import-sort'],
  rules: require(path.join(__dirname, '..', '.eslint-rules')),
  parserOptions: {
    requireConfigFile: false,
  },
};
