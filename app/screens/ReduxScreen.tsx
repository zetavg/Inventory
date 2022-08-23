import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Platform,
  ScrollView,
  View,
  TouchableOpacity,
  Text,
  TextInput,
} from 'react-native';

import type { StackScreenProps } from '@react-navigation/stack';
import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';

import { useAppSelector, useAppDispatch } from '@app/redux';

import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';
import useColors from '@app/hooks/useColors';
import useScrollTo from '@app/hooks/useScrollTo';

import cs from '@app/utils/commonStyles';

import ScreenContent from '@app/components/ScreenContent';
import InsetGroup from '@app/components/InsetGroup';
import { addCallback, ActionLog } from '@app/redux/middlewares/logger';
import removePasswordFromJSON from '@app/utils/removePasswordFromJSON';

const INITIAL_ACTION_STR = `{
  "type": "counter/incrementByAmount",
  "payload": 2
}`;

const ACTION_STR_PLACEHOLDER = `{
  "type": "",
  "payload": null
}`;

function ReduxScreen({
  navigation,
}: StackScreenProps<StackParamList, 'Redux'>) {
  const rootNavigation = useRootNavigation();
  const { iosTintColor } = useColors();

  const scrollViewRef = useRef<ScrollView>(null);
  useScrollViewContentInsetFix(scrollViewRef);

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

  const dispatchActionGroup = useRef<View>(null);
  const dispatchActionInput = useRef<TextInput>(null);

  const scrollTo = useScrollTo(scrollViewRef);

  return (
    <ScreenContent
      navigation={navigation}
      title="Redux"
      action1Label="Dispatch Action"
      action1SFSymbolName="arrow.forward.square.fill"
      action1MaterialIconName="arrow-right-bold-box"
      onAction1Press={() => {
        dispatchActionInput.current?.focus();
        scrollTo(dispatchActionGroup);
      }}
    >
      <ScrollView
        ref={scrollViewRef}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <InsetGroup style={cs.mt16}>
          <InsetGroup.Item
            vertical2
            label="Current State"
            detail={removePasswordFromJSON(JSON.stringify(state, null, 2))}
          />
        </InsetGroup>

        <InsetGroup
          label="Dispatch Action"
          footerLabel={isActionInvalid ? 'Invalid JSON' : undefined}
          ref={dispatchActionGroup}
        >
          <InsetGroup.Item
            vertical2
            label="Action"
            detail={
              <InsetGroup.TextInput
                ref={dispatchActionInput}
                multiline
                scrollEnabled={false}
                placeholder={ACTION_STR_PLACEHOLDER}
                value={actionStr}
                onChangeText={setActionStr}
              />
            }
          />
          <InsetGroup.ItemSeperator />
          <InsetGroup.Item
            // arrow
            button
            label="Select..."
            onPress={() =>
              rootNavigation?.push('ReduxSelectCommonActions', {
                callback: (a: string) => {
                  setActionStr(a);
                  scrollTo(dispatchActionGroup);
                },
              })
            }
          />
          <InsetGroup.ItemSeperator />
          <InsetGroup.Item
            button
            destructive
            label="Dispatch Action"
            disabled={isActionInvalid}
            onPress={() => dispatch(JSON.parse(actionStr))}
          />
        </InsetGroup>

        {actionLogs.length > 0 && (
          <InsetGroup
            label="Action Logs"
            labelRight={
              <TouchableOpacity onPress={() => setActionLogs([])}>
                <Text
                  style={{
                    fontSize: InsetGroup.GROUP_LABEL_FONT_SIZE,
                    color: iosTintColor,
                  }}
                >
                  Clear
                </Text>
              </TouchableOpacity>
            }
          >
            {actionLogs
              .flatMap(({ action, prevState, nextState }: any, i) => {
                const stringifiedAction = JSON.stringify(action);

                return [
                  <InsetGroup.Item
                    key={i}
                    label={action?.type || stringifiedAction}
                    detail={action?.type && stringifiedAction}
                    compactLabel
                    arrow
                    onPress={() =>
                      navigation.push('ReduxActionDetail', {
                        action,
                        prevState,
                        nextState,
                      })
                    }
                  />,
                  <InsetGroup.ItemSeperator key={`s-${i}`} />,
                ];
              })
              .slice(0, -1)}
          </InsetGroup>
        )}
      </ScrollView>
    </ScreenContent>
  );
}

export default ReduxScreen;