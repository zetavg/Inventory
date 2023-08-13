import React, { useCallback, useRef, useState } from 'react';
import { ScrollView } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import {
  DATA_TYPE_NAMES,
  DataTypeName,
  fixConsistency,
  getHumanTypeName,
} from '@app/data';

import { useDB } from '@app/db';

import type { StackParamList } from '@app/navigation/MainStack';

import useLogger from '@app/hooks/useLogger';

import ScreenContent from '@app/components/ScreenContent';
import UIGroup from '@app/components/UIGroup';

function FixDataConsistencyScreen({
  navigation,
}: StackScreenProps<StackParamList, 'FixDataConsistency'>) {
  const scrollViewRef = useRef<ScrollView>(null);
  const { kiaTextInputProps } =
    ScreenContent.ScrollView.useAutoAdjustKeyboardInsetsFix(scrollViewRef);

  const logger = useLogger('FixDataConsistencyScreen');
  const { db } = useDB();

  const [successes, setSuccesses] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<
    Record<
      string,
      Array<{ id: string | undefined; rawId: string; error: unknown }>
    >
  >({});

  const [working, setWorking] = useState(false);
  const handleStart = useCallback(async () => {
    setWorking(true);
    setSuccesses({});
    setErrors({});
    try {
      if (!db) throw new Error('DB is not ready');
      await new Promise(resolve =>
        setTimeout(() => {
          resolve(null);
        }, 100),
      );
      await fixConsistency({
        db,
        successCallback: data => {
          setSuccesses(d => ({
            ...d,
            [data.__type]: (d[data.__type] || 0) + 1,
          }));
          return new Promise(resolve => {
            setTimeout(() => {
              resolve();
            }, 2);
          });
        },
        errorCallback: info => {
          setErrors(d => ({
            ...d,
            [info.type]: [
              ...(d[info.type] || []),
              { id: info.id, rawId: info.rawId, error: info.error },
            ],
          }));
          return new Promise(resolve => {
            setTimeout(() => {
              resolve();
            }, 2);
          });
        },
      });
    } catch (e) {
      logger.error(e, { showAlert: true });
    } finally {
      setWorking(false);
    }
  }, [db, logger]);

  const [showRawResults, setShowRawResults] = useState(false);

  return (
    <ScreenContent navigation={navigation} title="Fix Data Consistency">
      <ScreenContent.ScrollView ref={scrollViewRef}>
        <UIGroup.FirstGroupSpacing iosLargeTitle />
        <UIGroup loading={working}>
          <UIGroup.ListItem button label="Start" onPress={handleStart} />
        </UIGroup>
        {Object.keys(errors).length > 0 && (
          <UIGroup
            header="Errors"
            footer="⚠ The items listed above could not be saved. Click on each to view the details."
          >
            {UIGroup.ListItemSeparator.insertBetween(
              Object.entries(errors).map(([k, v]) => (
                <UIGroup.ListItem
                  key={k}
                  label={getHumanTypeName(k, { titleCase: true })}
                  detail={v.length}
                  navigable
                  onPress={() =>
                    navigation.push('FixDataConsistencyErrors', { errors: v })
                  }
                />
              )),
            )}
          </UIGroup>
        )}
        {Object.keys(successes).length > 0 && (
          <UIGroup header="Processed Items">
            {UIGroup.ListItemSeparator.insertBetween(
              Object.entries(successes).map(([k, v]) => (
                <UIGroup.ListItem
                  key={k}
                  label={getHumanTypeName(k, { titleCase: true })}
                  detail={v}
                />
              )),
            )}
          </UIGroup>
        )}
        <UIGroup>
          <UIGroup.ListItem
            label="Show Raw Results"
            detail={
              <UIGroup.ListItem.Switch
                value={showRawResults}
                onValueChange={v => setShowRawResults(v)}
              />
            }
          />
          {showRawResults && (
            <>
              <UIGroup.ListItemSeparator />
              <UIGroup.ListTextInputItem
                label="Raw Results"
                multiline
                monospaced
                small
                showSoftInputOnFocus={false}
                value={JSON.stringify({ successes, errors }, null, 2)}
              />
            </>
          )}
        </UIGroup>
      </ScreenContent.ScrollView>
    </ScreenContent>
  );
}

export default FixDataConsistencyScreen;
