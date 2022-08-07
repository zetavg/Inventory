import React from 'react';
import { StyleSheet, View } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#eaeaea',
  },
});

export const decorators = [
  Story => (
    <View style={styles.container}>
      <Story />
    </View>
  ),
];
export const parameters = {};
