import React, { useRef, useState } from 'react';
import { ScrollView } from 'react-native';

import type { StackScreenProps } from '@react-navigation/stack';
import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';

import { useAppSelector, useAppDispatch } from '@app/redux';
import { selectActiveProfileConfig } from '@app/features/profiles';

import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';

import cs from '@app/utils/commonStyles';

import ScreenContent from '@app/components/ScreenContent';
import InsetGroup from '@app/components/InsetGroup';
import { selectConfig } from '../selectors';

function DBSyncConfigScreen({
  navigation,
}: StackScreenProps<StackParamList, 'DBSyncConfig'>) {
  const rootNavigation = useRootNavigation();

  const scrollViewRef = useRef<ScrollView>(null);
  useScrollViewContentInsetFix(scrollViewRef);

  const syncTargets = useAppSelector(selectConfig) || {};

  const hasConfig = Object.keys(syncTargets).length > 0;

  return (
    <ScreenContent navigation={navigation} title="Manage Remotes">
      <ScrollView
        ref={scrollViewRef}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        {hasConfig && (
          <InsetGroup style={cs.mt16}>
            {Object.entries(syncTargets)
              .flatMap(([name, config]) => [
                <InsetGroup.Item
                  key={name}
                  label={name}
                  detail={config.db.uri}
                  onPress={() =>
                    rootNavigation?.push('DBSyncConfigUpdate', { name })
                  }
                />,
                <InsetGroup.ItemSeparator key={`s-${name}`} />,
              ])
              .slice(0, -1)}
          </InsetGroup>
        )}

        <InsetGroup style={hasConfig ? undefined : cs.mt16}>
          <InsetGroup.Item
            button
            label="Add Remote"
            onPress={() => rootNavigation?.push('DBSyncConfigUpdate', {})}
          />
        </InsetGroup>
      </ScrollView>
    </ScreenContent>
  );
}

export default DBSyncConfigScreen;
