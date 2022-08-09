import React from 'react';
import { View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { StackParamList } from '@app/navigation/MainStack';
import StorybookUIRoot from '@app/StorybookUIRoot';
import useIsDarkMode from '@app/hooks/useIsDarkMode';
import useTabBarInsets from '@app/hooks/useTabBarInsets';
import useColor from '@app/hooks/useColor';
import commonStyles from '@app/utils/commonStyles';

function StorybookScreen({}: StackScreenProps<StackParamList, 'Storybook'>) {
  const tabBarInsets = useTabBarInsets();
  const isDarkMode = useIsDarkMode();
  const { backgroundColor } = useColor();
  return (
    <View
      style={[
        commonStyles.flex1,
        { paddingBottom: tabBarInsets.bottom, backgroundColor },
      ]}
    >
      <StorybookUIRoot hideAdditionalControls darkMode={isDarkMode} />
    </View>
  );
}

export default StorybookScreen;
