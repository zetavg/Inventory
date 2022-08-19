import React, { useCallback, useRef, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import titleCase from '@app/utils/titleCase';

import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '@app/navigation/Navigation';

import { useAppSelector, useAppDispatch } from '@app/redux';

import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';

import cs from '@app/utils/commonStyles';

import ModalContent from '@app/components/ModalContent';
import InsetGroup from '@app/components/InsetGroup';

import {
  selectActiveProfileName,
  selectProfiles,
  switchProfile,
} from '../slice';

function SwitchProfileScreen({
  navigation,
}: StackScreenProps<RootStackParamList, 'SwitchProfile'>) {
  const dispatch = useAppDispatch();
  const profiles = useAppSelector(selectProfiles);
  const activeProfileName = useAppSelector(selectActiveProfileName);

  const scrollViewRef = useRef<ScrollView>(null);
  useScrollViewContentInsetFix(scrollViewRef);

  const handleSwitchProfile = useCallback(
    (profileName: string) => {
      Alert.alert(
        'Confirm',
        'Are you sure you want to switch profile? The app will be unloaded and all your unsaved changes will be discarded.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Switch Profile',
            style: 'destructive',
            onPress: () => dispatch(switchProfile(profileName)),
          },
        ],
      );
    },
    [dispatch],
  );

  return (
    <ModalContent navigation={navigation} title="Profiles">
      <ScrollView
        ref={scrollViewRef}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <InsetGroup style={cs.mt16}>
          {Object.keys(profiles.configs)
            .flatMap(profileName => [
              <InsetGroup.Item
                key={profileName}
                label={titleCase(profileName)}
                selected={activeProfileName === profileName}
                onPress={() => handleSwitchProfile(profileName)}
              />,
              <InsetGroup.ItemSeperator key={`s-${profileName}`} />,
            ])
            .slice(0, -1)}
        </InsetGroup>
        <InsetGroup>
          <InsetGroup.Item
            button
            label="New Profile"
            onPress={() => navigation.push('NewProfile')}
          />
        </InsetGroup>
      </ScrollView>
    </ModalContent>
  );
}

export default SwitchProfileScreen;
