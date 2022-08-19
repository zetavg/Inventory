import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableWithoutFeedback } from 'react-native';
import Navigation from '@app/navigation';
import useColors from '@app/hooks/useColors';

import cs from './utils/commonStyles';

const DEV_TOOLS_ENABLE_THRESHOLD = 24;

function SplashScreen() {
  const { backgroundColor, contentTextColor } = useColors();
  const [pressCount, setPressCount] = useState(0);

  const toDevToolsRemaining = DEV_TOOLS_ENABLE_THRESHOLD - pressCount;

  if (toDevToolsRemaining <= 0) {
    return <Navigation onlyDevTools />;
  }

  return (
    <View style={[cs.flex1, cs.centerChildren, { backgroundColor }]}>
      <TouchableWithoutFeedback onPress={() => setPressCount(c => c + 1)}>
        <View style={[styles.devToolsTrigger, cs.centerChildren]}>
          {pressCount > 5 && (
            <Text style={{ color: contentTextColor }}>
              {toDevToolsRemaining}
            </Text>
          )}
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  devToolsTrigger: {
    width: 100,
    height: 100,
  },
});

export default SplashScreen;
