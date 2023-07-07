import React from 'react';
import type { StackScreenProps } from '@react-navigation/stack';

import type { RootStackParamList } from '@app/navigation/Navigation';

import ModalContent from '@app/components/ModalContent';
import UIGroup from '@app/components/UIGroup';

import ProfileSwitcher from '../components/ProfileSwitcher';

function SwitchProfileScreen({
  navigation,
}: StackScreenProps<RootStackParamList, 'SwitchProfile'>) {
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
      </ModalContent.ScrollView>
    </ModalContent>
  );
}

export default SwitchProfileScreen;
