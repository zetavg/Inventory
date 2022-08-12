import useIsDarkMode from './useIsDarkMode';

function useColors() {
  const isDarkMode = useIsDarkMode();
  const backgroundColor = isDarkMode ? '#000000' : '#F2F2F6';
  const iosHeaderTintColor = isDarkMode ? '#3A82F7' : '#3478F6';

  return { backgroundColor, iosHeaderTintColor };
}

export default useColors;

// Android backgroundColor?
// Color(colors.background)
//   .desaturate(0.5)
//   .darken(0.02)
//   .hex();
