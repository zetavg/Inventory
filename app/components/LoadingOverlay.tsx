import React from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import useColors from '@app/hooks/useColors';
import Color from 'color';

type Props = { show: boolean; fullBackground?: boolean };

export default function LoadingOverlay({ show, fullBackground }: Props) {
  const { backgroundColor: bgColor } = useColors();
  if (!show) return null;

  const backgroundColor = fullBackground
    ? bgColor
    : Color(bgColor).opaquer(-0.5).hexa();

  return (
    <View style={[styles.loadingOverlay, { backgroundColor }]}>
      <ActivityIndicator />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
