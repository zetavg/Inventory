import React from 'react';
import { StyleSheet } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import commonStyles from '@app/utils/commonStyles';

import type { StackParamList } from '@app/navigation/MainStack';

import FullWidthImage from '@app/components/FullWidthImage';
import ScreenContent from '@app/components/ScreenContent';
import Text from '@app/components/Text';
import UIGroup from '@app/components/UIGroup';

import { howToSwitchProfile } from '@app/images';

function HowToSwitchBetweenProfilesScreen({
  navigation,
}: StackScreenProps<StackParamList, 'HowToSwitchBetweenProfiles'>) {
  return (
    <ScreenContent
      navigation={navigation}
      title="How to switch between profiles"
      headerLargeTitle={false}
    >
      <ScreenContent.ScrollView>
        <UIGroup.FirstGroupSpacing />
        <UIGroup style={[commonStyles.pv24, commonStyles.ph8]}>
          <Text style={styles.text}>
            To access the profiles menu,{' '}
            <Text style={[styles.text, commonStyles.fwBold]}>
              ➊ switch to the "More" tab by pressing it on the bottom right of
              the main screen,
            </Text>{' '}
            and then{' '}
            <Text style={[styles.text, commonStyles.fwBold]}>
              ➋ press the user icon on the top right.
            </Text>
          </Text>
          <Text> </Text>
          <FullWidthImage source={howToSwitchProfile} />
          <Text> </Text>
          <Text style={styles.text}>
            There you'll be able to switch between, create new or edit your
            profiles.
          </Text>
        </UIGroup>
      </ScreenContent.ScrollView>
    </ScreenContent>
  );
}
export default HowToSwitchBetweenProfilesScreen;

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    textAlign: 'center',
  },
});
