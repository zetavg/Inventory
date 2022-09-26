import { useActionSheet as useActionSheetExpo } from '@expo/react-native-action-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function useActionSheet() {
  const { bottom: safeAreaBottomInset } = useSafeAreaInsets();
  const { showActionSheetWithOptions, ...other } = useActionSheetExpo();

  const showActionSheetWithOptionsWithBottomSafeAreaInsetFix: typeof showActionSheetWithOptions =
    ({ containerStyle, ...options }, handlerFn) => {
      showActionSheetWithOptions(
        {
          ...options,
          containerStyle: {
            paddingBottom: safeAreaBottomInset,
            ...containerStyle,
          },
        },
        handlerFn,
      );
    };

  return {
    showActionSheetWithOptions:
      showActionSheetWithOptionsWithBottomSafeAreaInsetFix,
    ...other,
  };
}
