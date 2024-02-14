import React, { useCallback, useRef } from 'react';
import { ScrollView, View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import { actions, store } from '@app/redux';
import { filterOutCacheFromState } from '@app/redux/utils';

import cs from '@app/utils/commonStyles';
import commonStyles from '@app/utils/commonStyles';

import type { RootStackParamList } from '@app/navigation/Navigation';

import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';

import ModalContent from '@app/components/ModalContent';
import UIGroup from '@app/components/UIGroup';

function mapActionsToItems(acs: any, handleSelect: any) {
  return UIGroup.ListItemSeparator.insertBetween(
    Object.entries(acs).map(([key, ac]) => {
      const mockPayload: any = null;
      // const action =
      //   (ac as any).length === 0 ? (ac as any)() : (ac as any)(mockPayload);
      const action = (ac as any)(mockPayload);
      const actionStr = JSON.stringify(action);
      const actionStrPretty = JSON.stringify(action, null, 2);
      return (
        <UIGroup.ListItem
          key={key}
          label={key}
          detail={actionStr}
          detailTextStyle={commonStyles.devToolsMonospaced}
          onPress={() => handleSelect(actionStrPretty)}
        />
      );
    }),
  );
}

function ReduxSelectActionScreen({
  navigation,
  route,
}: StackScreenProps<RootStackParamList, 'ReduxSelectAction'>) {
  const { callback } = route.params;

  const scrollViewRef = useRef<ScrollView>(null);
  useScrollViewContentInsetFix(scrollViewRef);

  const handleSelect = useCallback(
    (data: string) => {
      callback(data);
      navigation.goBack();
    },
    [callback, navigation],
  );

  return (
    <ModalContent navigation={navigation} title="Select Action">
      <ModalContent.ScrollView
        ref={scrollViewRef}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <View style={cs.mt16} />
        {Object.entries(actions).map(([group, actionItems]) => (
          <UIGroup key={group} header={group}>
            {mapActionsToItems(actionItems, handleSelect)}
          </UIGroup>
        ))}

        <UIGroup
          header="🚧 Developer Only 🚧"
          footer="⚠️ DANGER: This action can reset the entire app state! Use the entire new state as the payload. This has no foolproof protection against accidental use, and might cause data corruption if used incorrectly. Use with extreme caution."
        >
          <UIGroup.ListItem
            label="Global Set State"
            detail={'{ type: "__GLOBAL_SET_STATE__", payload: ... }'}
            detailTextStyle={commonStyles.devToolsMonospaced}
            onPress={() =>
              handleSelect(
                JSON.stringify(
                  {
                    type: '__GLOBAL_SET_STATE__',
                    payload: filterOutCacheFromState(store.getState()),
                  },
                  null,
                  2,
                ),
              )
            }
          />
        </UIGroup>
      </ModalContent.ScrollView>
    </ModalContent>
  );
}

export default ReduxSelectActionScreen;
