import { useColorScheme } from 'react-native';

function useIsDarkMode() {
  const isDarkMode = useColorScheme() === 'dark';
  return isDarkMode;
}

export default useIsDarkMode;
