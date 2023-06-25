import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import Text from '@app/components/Text';
import UIGroup from '@app/components/UIGroup';

export const Readme = () => (
  <ScrollView>
    <UIGroup.FirstGroupSpacing />
    <UIGroup style={styles.group}>
      <Text variant="titleLarge">Components</Text>
      <Text>These are shared UI components of the app.</Text>
      <Text>Components are divided into the following categories:</Text>

      <View style={styles.spacing} />

      <Text variant="titleMedium">A. Logical Components</Text>
      <Text>
        High level, logically abstracted components. These components are
        platform-irrelevant and aim to provide a native feeling on each
        platform.
      </Text>
      <Text>
        These components should be used as the first preference when building
        the UI.
      </Text>

      <View style={styles.spacing} />

      <Text variant="titleMedium">B. Element Components</Text>
      <Text>Universal UI Elements.</Text>

      <View style={styles.spacing} />

      <Text variant="titleMedium">Z. Other Components</Text>
      <Text>Should avoid using in the UI directly.</Text>
    </UIGroup>

    <UIGroup style={styles.group}>
      <Text>
        Stories are prefixed with the component's categories. Such as: "[A]
        UIGroup".
      </Text>
      <Text>
        Stories without a prefixed should be considered to be in the "Other
        Components" category.
      </Text>
    </UIGroup>

    <UIGroup style={styles.group}>
      <Text>
        On your device, press the "NAVIGATOR" tab and select a story to view it.
      </Text>
      <Text>⬇️</Text>
    </UIGroup>
  </ScrollView>
);

const styles = StyleSheet.create({
  group: {
    padding: 16,
    gap: 16,
  },
  spacing: {
    marginTop: -8,
  },
});
