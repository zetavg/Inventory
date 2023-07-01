import React, { useCallback } from 'react';
import { Alert } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import { actions, selectors, useAppDispatch, useAppSelector } from '@app/redux';

import type { RootStackParamList } from '@app/navigation/Navigation';

import ModalContent from '@app/components/ModalContent';
import UIGroup from '@app/components/UIGroup';

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
      <ModalContent.ScrollView>
        <UIGroup.FirstGroupSpacing />
        <ProfileSelector
          label="Select a profile to delete"
          onSelect={({ uuid }) => handleDeleteProfile(uuid)}
        />
      </ModalContent.ScrollView>
    </ModalContent>
  );
}

export default DeleteProfileScreen;
