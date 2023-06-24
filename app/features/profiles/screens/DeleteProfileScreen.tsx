import React, { useCallback, useRef } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import { actions, selectors, useAppDispatch, useAppSelector } from '@app/redux';

import cs from '@app/utils/commonStyles';

import type { RootStackParamList } from '@app/navigation/Navigation';

import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';

import ModalContent from '@app/components/ModalContent';

import beforeDeleteProfile from '../beforeDeleteProfile';
import ProfileSelector from '../components/ProfileSelector';

function DeleteProfileScreen({
  navigation,
}: StackScreenProps<RootStackParamList, 'DeleteProfile'>) {
  const dispatch = useAppDispatch();
  const currentProfileUuid = useAppSelector(
    selectors.profiles.currentProfileUuid,
  );
  const profileUuidAndNames = useAppSelector(
    selectors.profiles.profileUuidAndNames,
  );

  const scrollViewRef = useRef<ScrollView>(null);
  useScrollViewContentInsetFix(scrollViewRef);

  const handleDeleteProfile = useCallback(
    (profileUuid: string) => {
      Alert.alert(
        `Confirm Delete "${profileUuidAndNames[profileUuid]}"`,
        `Are you sure you want to delete the profile "${profileUuidAndNames[profileUuid]}" (${profileUuid})? Any un-synced data will be lost!`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              Alert.alert(
                'Double Confirm',
                `Are you really sure you want to delete the profile "${profileUuidAndNames[profileUuid]}" (${profileUuid})?`,
                [
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await beforeDeleteProfile(profileUuid, {
                          currentProfileUuid,
                        });
                        dispatch(actions.profiles.deleteProfile(profileUuid));
                        navigation.goBack();
                      } catch (e: any) {
                        Alert.alert('Error', e.message);
                      }
                    },
                  },
                ],
              );
            },
          },
        ],
      );
    },
    [currentProfileUuid, dispatch, navigation, profileUuidAndNames],
  );

  return (
    <ModalContent navigation={navigation} title="Delete Profile">
      <ScrollView
        ref={scrollViewRef}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <View style={cs.mt16} />
        <ProfileSelector
          label="Select a profile to delete"
          onSelect={({ uuid }) => handleDeleteProfile(uuid)}
        />
      </ScrollView>
    </ModalContent>
  );
}

export default DeleteProfileScreen;
