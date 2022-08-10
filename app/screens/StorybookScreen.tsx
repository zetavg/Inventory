import React from 'react';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { StackScreenProps } from '@react-navigation/stack';
import type { StackParamList } from '@app/navigation/MainStack';
import StorybookUIRoot from '@app/StorybookUIRoot';
import useIsDarkMode from '@app/hooks/useIsDarkMode';
import useTabBarInsets from '@app/hooks/useTabBarInsets';
import useColors from '@app/hooks/useColors';
import commonStyles from '@app/utils/commonStyles';

function StorybookScreen({}: StackScreenProps<StackParamList, 'Storybook'>) {
  const safeAreaInsets = useSafeAreaInsets();
  const tabBarInsets = useTabBarInsets();
  const isDarkMode = useIsDarkMode();
  const { backgroundColor } = useColors();
  return (
    <View
      style={[
        commonStyles.flex1,
        // eslint-disable-next-line react-native/no-inline-styles
        {
          paddingTop: Platform.OS === 'android' ? safeAreaInsets.top : 0,
          paddingBottom: tabBarInsets.bottom,
          backgroundColor,
        },
      ]}
    >
      <StorybookUIRoot hideAdditionalControls darkMode={isDarkMode} />
    </View>
  );
}

export default StorybookScreen;
