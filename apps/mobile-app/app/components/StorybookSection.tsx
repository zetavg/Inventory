import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { Divider, Text } from 'react-native-paper';

type Props = {
  title?: string;
  children: React.ReactNode;
  style?: React.ComponentProps<typeof View>['style'];
};

function StorybookSection({ title, children, style }: Props) {
  return (
    <View style={[{ marginBottom: 16 }, style]}>
      {title ? (
        <>
          <Text variant="labelSmall" style={styles.title}>
            {title}
          </Text>
          <Divider style={{ marginTop: 1, marginBottom: 8 }} />
        </>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    opacity: 0.5,
  },
});

export default StorybookSection;
