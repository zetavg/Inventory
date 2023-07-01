import React, { useCallback } from 'react';
import { Alert } from 'react-native';

import { actions, selectors, useAppDispatch, useAppSelector } from '@app/redux';

import UIGroup from '@app/components/UIGroup';

function ProfileSwitcher() {
  const dispatch = useAppDispatch();
  const profileUuidAndNames = useAppSelector(
    selectors.profiles.profileUuidAndNames,
  );
  const currentProfileUuid = useAppSelector(
    selectors.profiles.currentProfileUuid,
  );

  const _handleSwitchProfile = useCallback(
    (profileUuid: string) => {
      dispatch(actions.profiles.switchProfile(profileUuid));
    },
    [dispatch],
  );

  const handleSwitchProfile = useCallback(
    (profileUuid: string) => {
      if (!currentProfileUuid) {
        _handleSwitchProfile(profileUuid);
        return;
      }

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
            onPress: () => _handleSwitchProfile(profileUuid),
          },
        ],
      );
    },
    [_handleSwitchProfile, currentProfileUuid],
  );

  return (
    <UIGroup>
      {Object.entries(profileUuidAndNames)
        .sort(([, a], [, b]) => a.localeCompare(b))
        .flatMap(([profileUuid, profileName]) => [
          <UIGroup.ListItem
            key={profileUuid}
            label={profileName}
            selected={currentProfileUuid === profileUuid}
            onPress={() => handleSwitchProfile(profileUuid)}
          />,
          <UIGroup.ListItemSeparator key={`s-${profileUuid}`} />,
        ])
        .slice(0, -1)}
    </UIGroup>
  );
}

export default ProfileSwitcher;
