import React, { useCallback } from 'react';
import type { StackScreenProps } from '@react-navigation/stack';

import type { RootStackParamList } from '@app/navigation/Navigation';

import ModalContent from '@app/components/ModalContent';
import UIGroup from '@app/components/UIGroup';

import ProfileSelector from '../components/ProfileSelector';

function SelectProfileToEditScreen({
  navigation,
}: StackScreenProps<RootStackParamList, 'SelectProfileToEdit'>) {
  const handleSelectProfileToEdit = useCallback(
    (profileUuid: string) => {
      navigation.push('CreateOrUpdateProfile', { uuid: profileUuid });
    },
    [navigation],
  );

  return (
    <ModalContent navigation={navigation} title="Edit Profile">
      <ModalContent.ScrollView>
        <UIGroup.FirstGroupSpacing />
        <ProfileSelector
          label="Select a profile to edit"
          onSelect={({ uuid }) => handleSelectProfileToEdit(uuid)}
        />
      </ModalContent.ScrollView>
    </ModalContent>
  );
}

export default SelectProfileToEditScreen;
