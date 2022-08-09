import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { Divider, Text } from 'react-native-paper';

type Props = {
  title?: string;
  children: React.ReactNode;
};

function StorybookSection({ title, children }: Props) {
  return (
    <View style={{ marginBottom: 16 }}>
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
