import React from 'react';
import { StyleSheet, View } from 'react-native';

import useTheme from '@app/hooks/useTheme';

function StorybookStoryContainer({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
});

export default StorybookStoryContainer;
