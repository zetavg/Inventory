import React from 'react';
import { Text, View } from 'react-native';

import { selectors, useAppSelector } from '@app/redux';

import commonStyles from '@app/utils/commonStyles';

import TimeAgo from '@app/components/TimeAgo';
import UIGroup from '@app/components/UIGroup';

type Props = {
  itemNavigable?: boolean;
  onItemPress?: (serverId: string) => void;
};

export default function ServerList({ itemNavigable, onItemPress }: Props) {
  const servers = useAppSelector(selectors.dbSync.servers);
  const serverStatuses = useAppSelector(selectors.dbSync.serverStatuses);

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
                  // eslint-disable-next-line react/no-unstable-nested-components
                  detail={({ textProps }) => {
                    const lastSyncedAt = serverStatuses[id]?.lastSyncedAt;
                    const status = serverStatuses[id]?.status || '-';
                    return (
                      <View style={commonStyles.row}>
                        {[
                          status === '-' ? (
                            lastSyncedAt ? null : (
                              <Text key="status" {...textProps}>
                                -
                              </Text>
                            )
                          ) : (
                            <Text key="status" {...textProps}>
                              {status}
                            </Text>
                          ),
                          lastSyncedAt ? (
                            <Text key="lastSyncedAt" {...textProps}>
                              {status === '-' ? 'L' : 'l'}ast synced{' '}
                              <TimeAgo
                                date={lastSyncedAt}
                                style="round-minute"
                              />
                            </Text>
                          ) : null,
                        ]
                          .filter(elem => elem)
                          .flatMap((elem, i) => [
                            elem,
                            <Text key={`s-${i}`} {...textProps}>
                              {' '}
                              ·{' '}
                            </Text>,
                          ])
                          .slice(0, -1)}
                      </View>
                    );
                  }}
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
