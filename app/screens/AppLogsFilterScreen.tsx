import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { StackScreenProps } from '@react-navigation/stack';

import { LOG_LEVELS } from '@app/logger';

import type { RootStackParamList } from '@app/navigation/Navigation';

import useActionSheet from '@app/hooks/useActionSheet';

import ModalContent from '@app/components/ModalContent';
import ScreenContentScrollView from '@app/components/ScreenContentScrollView';
import UIGroup from '@app/components/UIGroup';

function AppLogsFilterScreen({
  navigation,
  route,
}: StackScreenProps<RootStackParamList, 'AppLogsFilter'>) {
  const { callback, selections, initialState } = route.params;
  const [state, setState] = useState(initialState);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    return () => callback(stateRef.current);
  }, [callback]);

  const { showActionSheet } = useActionSheet();

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
            clearButtonMode="always"
            rightElement={
              selections.module && selections.module.length > 0 ? (
                <UIGroup.ListTextInputItemButton
                  onPress={() => {
                    showActionSheet(
                      (selections.module || []).map(t => ({
                        name: t,
                        onSelect: () =>
                          setState(s => ({ ...s, module: t || undefined })),
                      })),
                    );
                  }}
                >
                  Select
                </UIGroup.ListTextInputItemButton>
              ) : undefined
            }
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            label="Function"
            placeholder="(All)"
            value={state.function}
            onChangeText={text =>
              setState(s => ({ ...s, function: text || undefined }))
            }
            clearButtonMode="always"
            rightElement={
              selections.function && selections.function.length > 0 ? (
                <UIGroup.ListTextInputItemButton
                  onPress={() => {
                    showActionSheet(
                      (selections.function || []).map(t => ({
                        name: t,
                        onSelect: () =>
                          setState(s => ({ ...s, function: t || undefined })),
                      })),
                    );
                  }}
                >
                  Select
                </UIGroup.ListTextInputItemButton>
              ) : undefined
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
            clearButtonMode="always"
            rightElement={
              selections.user && selections.user.length > 0 ? (
                <UIGroup.ListTextInputItemButton
                  onPress={() => {
                    showActionSheet(
                      (selections.user || []).map(t => ({
                        name: t,
                        onSelect: () =>
                          setState(s => ({ ...s, user: t || undefined })),
                      })),
                    );
                  }}
                >
                  Select
                </UIGroup.ListTextInputItemButton>
              ) : undefined
            }
          />
        </UIGroup>
        <UIGroup header="Levels">
          {UIGroup.ListItemSeparator.insertBetween(
            LOG_LEVELS.map(level => (
              <UIGroup.ListItem
                key={level}
                label={level}
                selected={state.levels.includes(level)}
                onPress={() =>
                  setState(s => {
                    let newLevels = [...s.levels];
                    if (newLevels.includes(level)) {
                      newLevels = newLevels.filter(ss => ss !== level);
                    } else {
                      newLevels.push(level);
                    }
                    return {
                      ...s,
                      levels: [...newLevels],
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
