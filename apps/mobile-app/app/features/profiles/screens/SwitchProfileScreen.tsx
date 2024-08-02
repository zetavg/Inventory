import React from 'react';
import type { StackScreenProps } from '@react-navigation/stack';

import Clipboard from '@react-native-clipboard/clipboard';

import { selectors, useAppSelector } from '@app/redux';

import type { RootStackParamList } from '@app/navigation/Navigation';

import ModalContent from '@app/components/ModalContent';
import UIGroup from '@app/components/UIGroup';

import ProfileSwitcher from '../components/ProfileSwitcher';

function SwitchProfileScreen({
  navigation,
}: StackScreenProps<RootStackParamList, 'SwitchProfile'>) {
  const currentProfileId = useAppSelector(
    selectors.profiles.currentProfileUuid,
  );

  return (
    <ModalContent navigation={navigation} title="Profiles">
      <ModalContent.ScrollView>
        <UIGroup.FirstGroupSpacing />
        <ProfileSwitcher />
        <UIGroup>
          <UIGroup.ListItem
            button
            label="New Profile..."
            onPress={() => navigation.push('CreateOrUpdateProfile', {})}
          />
        </UIGroup>
        <UIGroup>
          <UIGroup.ListItem
            button
            label="Edit Profile..."
            onPress={() => navigation.push('SelectProfileToEdit')}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            button
            label="Delete Profile..."
            onPress={() => navigation.push('DeleteProfile')}
          />
        </UIGroup>

        <UIGroup>
          <UIGroup.ListItem
            button
            label="Copy Current Profile ID"
            onPress={() =>
              currentProfileId && Clipboard.setString(currentProfileId)
            }
          />
        </UIGroup>
      </ModalContent.ScrollView>
    </ModalContent>
  );
}

export default SwitchProfileScreen;
