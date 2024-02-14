import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native';

import { ICONS } from '@app/consts/icons';

import objectEntries from '@app/utils/objectEntries';

import StorybookStoryContainer from '@app/components/StorybookStoryContainer';
import Text from '@app/components/Text';

import Icon from './Icon';

export default {
  title: '[B] Icon',
  component: Icon,
};

export function Icons() {
  return (
    <ScrollView>
      <StorybookStoryContainer>
        <View style={styles.iconsContainer}>
          {objectEntries(ICONS).map(([name]) => (
            <View style={styles.iconItemContainer} key={name}>
              <Icon name={name} size={24} />
              <Text selectable style={styles.iconNameText}>
                {name}
              </Text>
            </View>
          ))}
        </View>
      </StorybookStoryContainer>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  iconsContainer: {
    marginHorizontal: 'auto',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  iconItemContainer: {
    marginVertical: 4,
    marginHorizontal: 4,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconNameText: {
    marginTop: 4,
    fontSize: 8,
    opacity: 0.5,
  },
});
