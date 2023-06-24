import React from 'react';

import { selectors, useAppSelector } from '@app/redux';

import InsetGroup from '@app/components/InsetGroup';

type Props = {
  label?: string;
  onSelect: (profile: { uuid: string; name: string }) => void;
};

function ProfileSelector({ label, onSelect }: Props) {
  const profileUuidAndNames = useAppSelector(
    selectors.profiles.profileUuidAndNames,
  );

  return (
    <InsetGroup label={label}>
      {Object.entries(profileUuidAndNames)
        .sort(([, a], [, b]) => a.localeCompare(b))
        .flatMap(([profileUuid, profileName]) => [
          <InsetGroup.Item
            key={profileUuid}
            label={profileName}
            onPress={() => onSelect({ uuid: profileUuid, name: profileName })}
          />,
          <InsetGroup.ItemSeparator key={`s-${profileUuid}`} />,
        ])
        .slice(0, -1)}
    </InsetGroup>
  );
}

export default ProfileSelector;
