import useIsDarkMode from './useIsDarkMode';

function useColors() {
  const isDarkMode = useIsDarkMode();
  const backgroundColor = isDarkMode ? '#000000' : '#F2F2F6';
  const groupTitleColor = isDarkMode ? '#8D8D93' : '#85858B';
  const contentBackgroundColor = isDarkMode ? '#1C1C1E' : '#FFFFFF';
  const contentTextColor = isDarkMode ? '#FFFFFF' : '#000000';
  const contentSecondaryTextColor = isDarkMode ? '#98989F' : '#8A8A8E';
  const contentDisabledTextColor = isDarkMode ? '#8F8F8F' : '#8F8F8F';
  const iosHeaderTintColor = isDarkMode ? '#3A82F7' : '#3478F6';
  const iosTintColor = isDarkMode ? '#3A82F7' : '#3478F6';
  const iosDestructiveColor = isDarkMode ? '#EB5545' : '#EB4D3D';
  const insetGroupSeperatorColor = isDarkMode ? '#3E3E40' : '#C7C7C9';

  const red = isDarkMode ? '#FF453A' : '#FF3B30';
  const orange = isDarkMode ? '#FF9F0A' : '#FF9500';
  const yellow = isDarkMode ? '#FFD60A' : '#FFCC00';
  const green = isDarkMode ? '#32D74B' : '#34C759';
  const teal = isDarkMode ? '#64D2FF' : '#5AC8FA';
  const blue = isDarkMode ? '#0A84FF' : '#007AFF';
  const indigo = isDarkMode ? '#5E5CE6' : '#5856D6';
  const purple = isDarkMode ? '#BF5AF2' : '#AF52DE';
  const pink = isDarkMode ? '#FF2D55' : '#FF2D55';

  return {
    backgroundColor,
    groupTitleColor,
    contentBackgroundColor,
    contentTextColor,
    contentSecondaryTextColor,
    contentDisabledTextColor,
    iosHeaderTintColor,
    iosTintColor,
    iosDestructiveColor,
    insetGroupSeperatorColor,
    red,
    orange,
    yellow,
    green,
    teal,
    blue,
    indigo,
    purple,
    pink,
  };
}

export default useColors;

// Android backgroundColor?
// Color(colors.background)
//   .desaturate(0.5)
//   .darken(0.02)
//   .hex();
