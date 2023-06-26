import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import { ActivityIndicator, DataTable } from 'react-native-paper';

import { getLogs, getLogsDBErrors, Log, logger } from '@app/logger';
import { LogSeverity } from '@app/logger/types';

import commonStyles from '@app/utils/commonStyles';
import timeAgo from '@app/utils/timeAgo';

import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';

import useColors from '@app/hooks/useColors';
import useDB from '@app/hooks/useDB';

import ScreenContent from '@app/components/ScreenContent';
import ScreenContentScrollView from '@app/components/ScreenContentScrollView';
import UIGroup from '@app/components/UIGroup';

function AppLogDetailScreen({
  navigation,
  route,
}: StackScreenProps<StackParamList, 'AppLogDetail'>) {
  const { log } = route.params;
  const rootNavigation = useRootNavigation();

  const colors = useColors();

  const severityColor = (severity: LogSeverity) => {
    switch (severity) {
      case 'debug':
        return colors.gray;
      case 'info':
        return colors.green;
      case 'log':
        return colors.blue;
      case 'warn':
        return colors.yellow;
      case 'error':
        return colors.red;
      default: {
        const s: never = severity;
        throw new Error(`Unknown severity ${s}`);
      }
    }
  };

  return (
    <ScreenContent navigation={navigation} title={log.message}>
      <ScreenContentScrollView>
        <UIGroup.FirstGroupSpacing iosLargeTitle />
        <UIGroup>
          <UIGroup.ListTextInputItem
            label="Severity"
            value={log.severity}
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
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            label="Timestamp"
            value={log.timestamp.toString()}
            multiline
            monospaced
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

const styles = StyleSheet.create({
  logListItem: {
    borderLeftWidth: 4,
  },
  smallText: {
    fontSize: 12,
  },
});

export default AppLogDetailScreen;
