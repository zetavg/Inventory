import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function useTabBarInsets() {
  const safeArea = useSafeAreaInsets();

  const insets = { bottom: 0, scrollViewBottom: 0 };

  if (Platform.OS === 'ios') {
    insets.bottom = 49 + safeArea.bottom - 4 - 1;
    insets.scrollViewBottom = insets.bottom / 2 + 5;
  }

  return insets;
}

export default useTabBarInsets;
