import { useActionSheet as useActionSheetExpo } from '@expo/react-native-action-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Option = {
  name: string;
  destructive?: boolean;
  onSelect: () => void;
};

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

  const showActionSheet = (
    options: ReadonlyArray<Option>,
    {
      showCancel = true,
      cancelText = 'Cancel',
      onCancel,
    }: {
      showCancel?: boolean;
      cancelText?: string;
      onCancel?: () => void;
    } = {},
  ) => {
    let destructiveButtonIndex: number | undefined = options.findIndex(
      o => o.destructive,
    );
    if (destructiveButtonIndex < 0) destructiveButtonIndex = undefined;
    const cancelButtonIndex: number | undefined = showCancel
      ? options.length
      : undefined;

    showActionSheetWithOptionsWithBottomSafeAreaInsetFix(
      {
        options: [
          ...options.map(o => o.name),
          ...(showCancel ? [cancelText] : []),
        ],
        cancelButtonIndex,
        destructiveButtonIndex,
      },
      selectedIndex => {
        if ((selectedIndex || 0) >= options.length) {
          onCancel && onCancel();
          return;
        }

        const option = options[selectedIndex as any];
        option?.onSelect();
      },
    );
  };

  return {
    showActionSheetWithOptions:
      showActionSheetWithOptionsWithBottomSafeAreaInsetFix,
    showActionSheet,
    ...other,
  };
}
