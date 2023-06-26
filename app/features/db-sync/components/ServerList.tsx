import React from 'react';

import { selectors, useAppSelector } from '@app/redux';

import UIGroup from '@app/components/UIGroup';

type Props = {
  itemNavigable?: boolean;
  onItemPress?: (serverId: string) => void;
};

export default function ServerList({ itemNavigable, onItemPress }: Props) {
  const servers = useAppSelector(selectors.dbSync.servers);
  return (
    <UIGroup header="Servers" placeholder="No servers configured.">
      {servers && Object.keys(servers).length > 0
        ? UIGroup.ListItemSeparator.insertBetween(
            Object.entries(servers)
              .sort(([_, server1], [__, server2]) =>
                server1.name.localeCompare(server2.name),
              )
              .map(([id, server]) => (
                <UIGroup.ListItem
                  key={id}
                  label={server.name}
                  detail={'TODO'}
                  verticalArrangedIOS
                  navigable={itemNavigable}
                  onPress={onItemPress && (() => onItemPress(id))}
                />
              )),
          )
        : null}
    </UIGroup>
  );
}
