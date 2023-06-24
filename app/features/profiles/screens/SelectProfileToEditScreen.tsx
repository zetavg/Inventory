import React, { useCallback, useRef } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import { actions, selectors, useAppDispatch, useAppSelector } from '@app/redux';

import cs from '@app/utils/commonStyles';

import type { RootStackParamList } from '@app/navigation/Navigation';

import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';

import InsetGroup from '@app/components/InsetGroup';
import ModalContent from '@app/components/ModalContent';

import ProfileSelector from '../components/ProfileSelector';

function SelectProfileToEditScreen({
  navigation,
}: StackScreenProps<RootStackParamList, 'SelectProfileToEdit'>) {
  const dispatch = useAppDispatch();
  const profileUuidAndNames = useAppSelector(
    selectors.profiles.profileUuidAndNames,
  );

  const scrollViewRef = useRef<ScrollView>(null);
  useScrollViewContentInsetFix(scrollViewRef);

  const handleSelectProfileToEdit = useCallback(
    (profileUuid: string) => {
      navigation.replace('CreateOrUpdateProfile', { uuid: profileUuid });
    },
    [navigation],
  );

  return (
    <ModalContent navigation={navigation} title="Edit Profile">
      <ScrollView
        ref={scrollViewRef}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <View style={cs.mt16} />
        <ProfileSelector
          label="Select a profile to edit"
          onSelect={({ uuid }) => handleSelectProfileToEdit(uuid)}
        />
      </ScrollView>
    </ModalContent>
  );
}

export default SelectProfileToEditScreen;
