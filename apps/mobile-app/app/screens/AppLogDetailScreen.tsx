import React from 'react';
import type { StackScreenProps } from '@react-navigation/stack';

import type { StackParamList } from '@app/navigation/MainStack';

import ScreenContent from '@app/components/ScreenContent';
import ScreenContentScrollView from '@app/components/ScreenContentScrollView';
import UIGroup from '@app/components/UIGroup';

function AppLogDetailScreen({
  navigation,
  route,
}: StackScreenProps<StackParamList, 'AppLogDetail'>) {
  const { log } = route.params;

  return (
    <ScreenContent navigation={navigation} title={log.message}>
      <ScreenContentScrollView>
        <UIGroup.FirstGroupSpacing iosLargeTitle />
        <UIGroup>
          <UIGroup.ListTextInputItem
            label="Level"
            value={log.level}
            placeholder="(undefined)"
            showSoftInputOnFocus={false}
            monospaced
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            label="Module"
            value={log.module}
            placeholder="(undefined)"
            showSoftInputOnFocus={false}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            label="Function"
            value={log.function}
            placeholder="(undefined)"
            showSoftInputOnFocus={false}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            label="User"
            value={log.user}
            placeholder="(undefined)"
            showSoftInputOnFocus={false}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            label="Message"
            value={log.message}
            multiline
            placeholder="(undefined)"
            showSoftInputOnFocus={false}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            label="Timestamp"
            // value={log.timestamp.toString()}
            value={`${new Date(log.timestamp).toLocaleString()} (${
              log.timestamp
            })`}
            multiline
            // monospaced
            placeholder="(undefined)"
            showSoftInputOnFocus={false}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            label="Details"
            value={log.details}
            multiline
            placeholder="(undefined)"
            showSoftInputOnFocus={false}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            label="Stack"
            value={log.stack}
            multiline
            monospaced
            small
            placeholder="(undefined)"
            showSoftInputOnFocus={false}
          />
        </UIGroup>
        <UIGroup>
          <UIGroup.ListTextInputItem
            label="Full Data"
            value={JSON.stringify(log, null, 2)}
            multiline
            monospaced
            small
            placeholder="(undefined)"
            showSoftInputOnFocus={false}
          />
        </UIGroup>
      </ScreenContentScrollView>
    </ScreenContent>
  );
}

export default AppLogDetailScreen;
