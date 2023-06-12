module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    'macros',
    [
      'react-native-reanimated/plugin',
      {
        // globals: ['__scanCodes'],
      },
    ],
  ],
};
