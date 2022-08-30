import React from 'react';
import { StyleSheet, View } from 'react-native';

import useColors from '@app/hooks/useColors';

function StorybookStoryContainer({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.ComponentProps<typeof View>['style'];
}) {
  const colors = useColors();
  const backgroundColor = colors.backgroundColor;
  return (
    <View style={[styles.container, { backgroundColor }, style]}>
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
