import useIsDarkMode from './useIsDarkMode';

function useColor() {
  const isDarkMode = useIsDarkMode();
  const backgroundColor = isDarkMode ? '#000000' : '#F2F2F6';

  return { backgroundColor };
}

export default useColor;

// Android backgroundColor?
// Color(colors.background)
//   .desaturate(0.5)
//   .darken(0.02)
//   .hex();
