import React, { useCallback, useRef } from 'react';
import { ScrollView } from 'react-native';

import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '@app/navigation/Navigation';

import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';

import cs from '@app/utils/commonStyles';

import ModalContent from '@app/components/ModalContent';
import InsetGroup from '@app/components/InsetGroup';
import { dbSyncSettingsSlice } from '@app/features/db-sync/manage/settingsSlice';

const SWITCH_PROFILE_ACTION = `{
  "type": "profiles/switchProfile",
  "payload": "default"
}`;
const CREATE_PROFILE_ACTION = `{
  "type": "profiles/createProfile",
  "payload": {
    "name": "NewProfile",
    "color": "blue"
  }
}`;
const DELETE_PROFILE_ACTION = `{
  "type": "profiles/deleteProfile",
  "payload": {
    "name": ""
  }
}`;

const UPDATE_SETTINGS_ACTION = `{
  "type": "settings/updateSettings",
  "payload": {
    "key": "value"
  }
}`;

const RESET_SETTINGS_ACTION = '{ "type": "settings/resetSettings" }';

const DB_SYNC_SET_DISABLED = JSON.stringify(
  dbSyncSettingsSlice.actions.setDisabled(true),
  null,
  2,
);

function ReduxSelectCommonActionsScreen({
  navigation,
  route,
}: StackScreenProps<RootStackParamList, 'ReduxSelectCommonActions'>) {
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
      <ScrollView
        ref={scrollViewRef}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <InsetGroup style={cs.mt16}>
          <InsetGroup.Item
            label="Switch Profile"
            detail={SWITCH_PROFILE_ACTION.replace(/\n */, '')}
            onPress={() => handleSelect(SWITCH_PROFILE_ACTION)}
          />
          <InsetGroup.Item
            label="Create Profile"
            detail={CREATE_PROFILE_ACTION.replace(/\n */, '')}
            onPress={() => handleSelect(CREATE_PROFILE_ACTION)}
          />
          <InsetGroup.Item
            label="Delete Profile"
            detail={DELETE_PROFILE_ACTION.replace(/\n */, '')}
            onPress={() => handleSelect(DELETE_PROFILE_ACTION)}
          />
        </InsetGroup>
        <InsetGroup>
          <InsetGroup.Item
            label="Update Settings"
            detail={UPDATE_SETTINGS_ACTION.replace(/\n */, '')}
            onPress={() => handleSelect(UPDATE_SETTINGS_ACTION)}
          />
          <InsetGroup.Item
            label="Reset Settings"
            detail={RESET_SETTINGS_ACTION.replace(/\n */, '')}
            onPress={() => handleSelect(RESET_SETTINGS_ACTION)}
          />
        </InsetGroup>

        <InsetGroup>
          <InsetGroup.Item
            label="DBSync Set Disabled"
            detail={DB_SYNC_SET_DISABLED.replace(/\n */, '')}
            onPress={() => handleSelect(DB_SYNC_SET_DISABLED)}
          />
        </InsetGroup>
      </ScrollView>
    </ModalContent>
  );
}

export default ReduxSelectCommonActionsScreen;
