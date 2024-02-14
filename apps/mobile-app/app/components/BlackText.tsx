import React from 'react';
import { Text, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  text: {
    color: '#333',
  },
});

export default function BlackText(props: React.ComponentProps<typeof Text>) {
  return <Text {...props} style={styles.text} />;
}
