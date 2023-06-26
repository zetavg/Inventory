import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { StackScreenProps } from '@react-navigation/stack';

import { LOG_SEVERITIES } from '@app/logger';

import type { RootStackParamList } from '@app/navigation/Navigation';

import ModalContent from '@app/components/ModalContent';
import ScreenContentScrollView from '@app/components/ScreenContentScrollView';
import UIGroup from '@app/components/UIGroup';

function AppLogsFilterScreen({
  navigation,
  route,
}: StackScreenProps<RootStackParamList, 'AppLogsFilter'>) {
  const { callback, initialState } = route.params;
  const [state, setState] = useState(initialState);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    return () => callback(stateRef.current);
  }, [callback]);

  return (
    <ModalContent
      navigation={navigation}
      title="Filter Logs"
      backButtonLabel="Done"
    >
      <ScreenContentScrollView automaticallyAdjustKeyboardInsets={false}>
        <UIGroup.FirstGroupSpacing />
        <UIGroup>
          <UIGroup.ListTextInputItem
            label="Module"
            placeholder="(All)"
            value={state.module}
            onChangeText={text =>
              setState(s => ({ ...s, module: text || undefined }))
            }
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            label="User"
            placeholder="(All)"
            value={state.user}
            onChangeText={text =>
              setState(s => ({ ...s, user: text || undefined }))
            }
          />
        </UIGroup>
        <UIGroup header="Severities">
          {UIGroup.ListItemSeparator.insertBetween(
            LOG_SEVERITIES.map(severity => (
              <UIGroup.ListItem
                key={severity}
                label={severity}
                selected={state.severities.includes(severity)}
                onPress={() =>
                  setState(s => {
                    let newSeverities = [...s.severities];
                    if (newSeverities.includes(severity)) {
                      newSeverities = newSeverities.filter(
                        ss => ss !== severity,
                      );
                    } else {
                      newSeverities.push(severity);
                    }
                    return {
                      ...s,
                      severities: [...newSeverities],
                    };
                  })
                }
              />
            )),
          )}
        </UIGroup>
      </ScreenContentScrollView>
    </ModalContent>
  );
}

export default AppLogsFilterScreen;
