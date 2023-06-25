import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, TextInput, View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import { persistor, useAppDispatch, useAppSelector } from '@app/redux';
import { ActionLog, addCallback } from '@app/redux/middlewares/logger';

import commonStyles from '@app/utils/commonStyles';
import removePasswordFromJSON from '@app/utils/removePasswordFromJSON';

import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';

import useScrollTo from '@app/hooks/useScrollTo';

import ScreenContent from '@app/components/ScreenContent';
import ScreenContentScrollView from '@app/components/ScreenContentScrollView';
import UIGroup from '@app/components/UIGroup';

const INITIAL_ACTION_STR = '';

const ACTION_STR_PLACEHOLDER = `{
  "type": "",
  "payload": null
}`;

function ReduxScreen({
  navigation,
}: StackScreenProps<StackParamList, 'Redux'>) {
  const rootNavigation = useRootNavigation();

  const state = useAppSelector(s => s);
  const dispatch = useAppDispatch();

  const [actionStr, setActionStr] = useState(INITIAL_ACTION_STR);
  let isActionInvalid = false;
  try {
    JSON.parse(actionStr);
  } catch (e) {
    isActionInvalid = true;
  }

  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const logAction = useCallback((log: ActionLog) => {
    setActionLogs(logs => [log, ...logs]);
  }, []);
  useEffect(() => addCallback(logAction), [logAction]);

  const scrollViewRef = useRef<ScrollView>(null);
  const scrollTo = useScrollTo(scrollViewRef);
  const dispatchActionGroup = useRef<View>(null);
  const dispatchActionInput = useRef<TextInput>(null);

  return (
    <ScreenContent
      navigation={navigation}
      title="Redux"
      action1Label="Dispatch Action"
      action1SFSymbolName="arrow.forward.square.fill"
      action1MaterialIconName="arrow-right-bold-box"
      onAction1Press={() => {
        // dispatchActionInput.current?.focus();
        scrollTo(dispatchActionGroup);
      }}
    >
      <ScreenContentScrollView ref={scrollViewRef}>
        <UIGroup.FirstGroupSpacing iosLargeTitle />
        <UIGroup>
          <UIGroup.ListTextInputItem
            label="Current State"
            monospaced
            small
            multiline
            value={removePasswordFromJSON(JSON.stringify(state, null, 2))}
            showSoftInputOnFocus={false}
          />
          <UIGroup.ListItemSeparator />
          {/* Not working, IDK why. */}
          {/*<UIGroup.Item
            button
            label="Flush"
            onPress={async () => {
              try {
                const response = await persistor.flush();
                Alert.alert('Response', JSON.stringify(response));
              } catch (e: any) {
                Alert.alert('Error', e.message);
              }
            }}
          />
          <UIGroup.ItemSeparator />*/}
          <UIGroup.ListItem
            button
            destructive
            label="Purge"
            onPress={handlePurgeReduxStore}
          />
        </UIGroup>

        <UIGroup
          largeTitle
          header="Dispatch Action"
          footer={
            !actionStr
              ? 'Enter action JSON to dispatch.'
              : isActionInvalid
              ? '⚠ Invalid JSON.'
              : 'Note that the dispatched action can be destructive.'
          }
          ref={dispatchActionGroup}
          headerRight={
            <UIGroup.TitleButton
              onPress={() =>
                rootNavigation?.push('ReduxSelectAction', {
                  callback: (a: string) => {
                    setActionStr(a);
                    scrollTo(dispatchActionGroup);
                  },
                })
              }
            >
              Select Action
            </UIGroup.TitleButton>
          }
        >
          <UIGroup.ListTextInputItem
            label="Action"
            ref={dispatchActionInput}
            multiline
            scrollEnabled={false}
            placeholder={ACTION_STR_PLACEHOLDER}
            value={actionStr}
            onChangeText={setActionStr}
            style={[commonStyles.devToolsMonospaced]}
            onFocus={ScreenContentScrollView.strf(
              scrollViewRef,
              dispatchActionGroup,
            )}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            button
            destructive
            label="Dispatch Action"
            disabled={isActionInvalid}
            onPress={() => dispatch(JSON.parse(actionStr))}
          />
        </UIGroup>

        {actionLogs.length > 0 && (
          <UIGroup
            largeTitle
            header="Action Logs"
            headerRight={
              <UIGroup.TitleButton onPress={() => setActionLogs([])}>
                Clear
              </UIGroup.TitleButton>
            }
          >
            {UIGroup.ListItemSeparator.insertBetween(
              actionLogs.map(({ action, prevState, nextState }: any, i) => {
                const stringifiedAction = JSON.stringify(action);

                return (
                  <UIGroup.ListItem
                    key={i}
                    label={action?.type || stringifiedAction}
                    detail={action?.type && stringifiedAction}
                    detailTextStyle={commonStyles.devToolsMonospacedDetails}
                    verticalArrangedIOS
                    navigable
                    onPress={() =>
                      navigation.push('ReduxActionDetail', {
                        action,
                        prevState,
                        nextState,
                      })
                    }
                  />
                );
              }),
            )}
          </UIGroup>
        )}
      </ScreenContentScrollView>
    </ScreenContent>
  );
}

function handlePurgeReduxStore() {
  Alert.alert(
    '⚠️ Confirmation',
    'Are you sure you want to purge the persisted Redux store? This will delete all the data and it cannot be undone!',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Purge',
        style: 'destructive',
        onPress: () => {
          Alert.alert(
            '⚠️ Double Confirmation of Purge',
            'We ask for confirmation again as this action is destructive and cannot be undone! Do you really, really, really, really, really, really, really, really, really, really, really, really, really, really, really, really, really, really, really, really, really, really, really, really, really, really, really, really, really, really, really, really, really, really, really, really, really, really, really, really, really, really, really, really, really, really, really, really, really, really, really, really, really, really, really, really, really, really, really, really, really, really, really, really want to purge the persisted Redux store?',
            [
              {
                text: 'Cancel',
                style: 'cancel',
              },
              {
                text: 'Purge!',
                style: 'destructive',
                onPress: async () => {
                  try {
                    await persistor.purge();
                    Alert.alert(
                      'Redux Store Purged',
                      "You'll need to force-quit the app to reset the Redux store.",
                    );
                  } catch (e: any) {
                    console.error(e);
                    Alert.alert('Error', e);
                  }
                },
              },
            ],
          );
        },
      },
    ],
  );
}

export default ReduxScreen;
