import React from 'react';

import { selectors, useAppSelector } from '@app/redux';

import UIGroup from '@app/components/UIGroup';

type Props = {
  label?: string;
  onSelect: (profile: { uuid: string; name: string }) => void;
};

function ProfileSelector({ label, onSelect }: Props) {
  const profileUuidAndNames = useAppSelector(
    selectors.profiles.profileUuidAndNames,
  );

  return (
    <UIGroup header={label}>
      {Object.entries(profileUuidAndNames)
        .filter(([uuid, name]) => [uuid, name || ''])
        .sort(([, a], [, b]) => a.localeCompare(b))
        .flatMap(([profileUuid, profileName]) => [
          <UIGroup.ListItem
            key={profileUuid}
            label={profileName}
            onPress={() => onSelect({ uuid: profileUuid, name: profileName })}
          />,
          <UIGroup.ListItemSeparator key={`s-${profileUuid}`} />,
        ])
        .slice(0, -1)}
    </UIGroup>
  );
}

export default ProfileSelector;
