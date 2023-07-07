import { useCallback } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';

/**
 * Customized useBottomSheetDynamicSnapPoints that works well with our sheet height limitation
 */
const useBottomSheetDynamicSnapPoints = (
  initialSnapPoints: Array<string | number>,
) => {
  const windowDimensions = useWindowDimensions();
  const safeAreaInsets = useSafeAreaInsets();
  const maxHeight =
    windowDimensions.height - safeAreaInsets.top - safeAreaInsets.bottom - 8;

  // variables
  const animatedContentHeight = useSharedValue(0);
  const animatedHandleHeight = useSharedValue(-999);
  const animatedSnapPoints = useDerivedValue(() => {
    if (
      animatedHandleHeight.value === -999 ||
      animatedContentHeight.value === 0
    ) {
      return initialSnapPoints.map(() => -999);
    }
    let contentWithHandleHeight =
      animatedContentHeight.value + animatedHandleHeight.value;

    if (contentWithHandleHeight > maxHeight)
      contentWithHandleHeight = maxHeight;

    return initialSnapPoints.map(snapPoint =>
      snapPoint === 'CONTENT_HEIGHT' ? contentWithHandleHeight : snapPoint,
    );
  }, [maxHeight]);
  const animatedScrollViewStyles = useAnimatedStyle(() => {
    let contentWithHandleHeight =
      animatedContentHeight.value + animatedHandleHeight.value;

    if (contentWithHandleHeight > maxHeight)
      contentWithHandleHeight = maxHeight;

    return {
      height: contentWithHandleHeight,
    };
  });

  // callbacks
  const handleContentLayout = useCallback(
    ({
      nativeEvent: {
        layout: { height },
      },
    }: any) => {
      animatedContentHeight.value = height;
    },
    [animatedContentHeight],
  );

  return {
    animatedSnapPoints,
    animatedHandleHeight,
    animatedContentHeight,
    animatedScrollViewStyles,
    handleContentLayout,
  };
};

export default useBottomSheetDynamicSnapPoints;
