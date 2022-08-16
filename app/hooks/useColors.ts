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
  };
}

export default useColors;

// Android backgroundColor?
// Color(colors.background)
//   .desaturate(0.5)
//   .darken(0.02)
//   .hex();
