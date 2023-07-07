import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import useColors from '@app/hooks/useColors';

function RfidScanScreen() {
  const { backgroundColor } = useColors();

  // useEffect(() => {
  //   console.warn('RfidScanScreen mounted');

  //   return () => {
  //     console.warn('RfidScanScreen will unmount');
  //   };
  // }, []);

  return (
    <View style={[styles.contentContainer, { backgroundColor }]}>
      <Text>Awesome 🎉</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    alignItems: 'center',
  },
});

export default RfidScanScreen;
