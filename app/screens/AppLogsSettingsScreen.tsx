import React, { useCallback, useRef, useState } from 'react';
import { RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';

import appLogger, {
  getLevelsToLog,
  getLogsToKeep,
  LOG_LEVELS,
  LogLevel,
  setLevelsToLog,
  setLogsToKeep,
} from '@app/logger';
const logger = appLogger.for({ module: 'AppLogs-UI' });

import type { StackParamList } from '@app/navigation/MainStack';

import ScreenContent from '@app/components/ScreenContent';
import ScreenContentScrollView from '@app/components/ScreenContentScrollView';
import UIGroup from '@app/components/UIGroup';

const LOGS_TO_KEEP_MESSAGE =
  'Warning: Setting to a smaller number will clear old logs immediately.';

function AppLogsSettingsScreen({
  navigation,
}: StackScreenProps<StackParamList, 'AppLogsSettings'>) {
  const [levelsToLogState, setLevelsToLogState] = useState<
    ReadonlyArray<LogLevel>
  >(getLevelsToLog());
  const loadLevelsToLog = useCallback(() => {
    const levels = getLevelsToLog();
    setLevelsToLogState(levels);
  }, []);

  const [logsToKeepState, setLogsToKeepState] = useState<string>(
    getLogsToKeep().toString(),
  );
  const loadLogsToKeep = useCallback(() => {
    const n = getLogsToKeep();
    setLogsToKeepState(n.toString());
  }, []);
  const [logsToKeepMessage, setLogsToKeepMessage] =
    useState<string>(LOGS_TO_KEEP_MESSAGE);
  const logsToKeepMessageTimer = useRef<any>(null);
  const handleSaveLogsToKeep = useCallback(() => {
    const n = parseInt(logsToKeepState, 10);
    logger.debug(`Setting logs to keep to${n}.`);
    setLogsToKeep(n);
    const newLogsToKeep = getLogsToKeep();
    setLogsToKeepState(newLogsToKeep.toString());
    logger.debug(`Logs to keep has been set to ${newLogsToKeep}.`);
    setLogsToKeepMessage(`Logs to keep has been set to ${newLogsToKeep}.`);
    if (logsToKeepMessageTimer.current)
      clearTimeout(logsToKeepMessageTimer.current);
    logsToKeepMessageTimer.current = setTimeout(() => {
      setLogsToKeepMessage(LOGS_TO_KEEP_MESSAGE);
    }, 5000);
  }, [logsToKeepState]);

  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(() => {
    setRefreshing(true);
    try {
      loadLevelsToLog();
      loadLogsToKeep();
    } catch (e) {
      logger.error(e, { showAlert: true });
    } finally {
      setRefreshing(false);
    }
  }, [loadLevelsToLog, loadLogsToKeep]);

  useFocusEffect(refresh);

  return (
    <ScreenContent
      navigation={navigation}
      title="Logger Settings"
      headerLargeTitle={false}
      // action1Label="Log (Test)"
      // action1SFSymbolName="text.badge.plus"
      // action1MaterialIconName="playlist-plus"
      // onAction1Press={() => {
      //   navigation.push('LoggerLog');
      // }}
    >
      <ScreenContentScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
      >
        <UIGroup.FirstGroupSpacing />
        <UIGroup header="Levels to Log">
          {UIGroup.ListItemSeparator.insertBetween(
            LOG_LEVELS.map(level => (
              <UIGroup.ListItem
                key={level}
                label={level}
                selected={levelsToLogState.includes(level)}
                onPress={() => {
                  let levels = [...levelsToLogState];
                  if (levels.includes(level)) {
                    levels = levels.filter(ss => ss !== level);
                  } else {
                    levels.push(level);
                  }
                  logger.debug(
                    `Setting log levels to ${JSON.stringify(levels)}.`,
                  );
                  setLevelsToLog(levels);
                  const newLevels = getLevelsToLog();
                  setLevelsToLogState(newLevels);
                  logger.debug(
                    `Log levels has been set to ${JSON.stringify(newLevels)}.`,
                  );
                }}
              />
            )),
          )}
        </UIGroup>

        <UIGroup header="Logs to Keep" footer={logsToKeepMessage}>
          <UIGroup.ListTextInputItem
            label="Logs Count"
            horizontalLabel
            keyboardType="number-pad"
            returnKeyType="done"
            value={logsToKeepState}
            onChangeText={setLogsToKeepState}
            selectTextOnFocus
            rightElement={
              <>
                {[100, 1000, 10000].map((n, i) => (
                  <UIGroup.ListTextInputItem.Button
                    key={i}
                    onPress={() => setLogsToKeepState(n.toString())}
                  >
                    {n.toString()}
                  </UIGroup.ListTextInputItem.Button>
                ))}
              </>
            }
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            button
            label="Save"
            onPress={handleSaveLogsToKeep}
            destructive={parseInt(logsToKeepState, 10) < getLogsToKeep()}
            // disabled={parseInt(logsToKeepState, 10) === getLogsToKeep()}
          />
        </UIGroup>
      </ScreenContentScrollView>
    </ScreenContent>
  );
}

export default AppLogsSettingsScreen;
