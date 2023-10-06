import React, { useRef } from 'react';
import { ScrollView } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import { DATA_TYPE_NAMES, getHumanName } from '@app/data';

import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';

import ScreenContent from '@app/components/ScreenContent';
import UIGroup from '@app/components/UIGroup';

function DataTypesScreen({
  navigation,
}: StackScreenProps<StackParamList, 'DataTypes'>) {
  const scrollViewRef = useRef<ScrollView>(null);

  const rootNavigation = useRootNavigation();

  const { kiaTextInputProps } =
    ScreenContent.ScrollView.useAutoAdjustKeyboardInsetsFix(scrollViewRef);

  return (
    <ScreenContent navigation={navigation} title="Data">
      <ScreenContent.ScrollView ref={scrollViewRef}>
        <UIGroup.FirstGroupSpacing iosLargeTitle />
        <UIGroup header="Types">
          {UIGroup.ListItemSeparator.insertBetween(
            DATA_TYPE_NAMES.map(type => (
              <UIGroup.ListItem
                key={type}
                label={getHumanName(type, {
                  titleCase: true,
                  plural: true,
                })}
                navigable
                onPress={() => {
                  navigation.navigate('DataList', { type });
                }}
              />
            )),
          )}
        </UIGroup>

        <UIGroup>
          <UIGroup.ListItem
            label="Fix Data Consistency"
            navigable
            onPress={() => {
              rootNavigation?.navigate('FixDataConsistency');
            }}
          />
        </UIGroup>

        <UIGroup>
          <UIGroup.ListItem
            label="Data Migration"
            navigable
            onPress={() => {
              navigation.navigate('DevDataMigration');
            }}
          />
        </UIGroup>
      </ScreenContent.ScrollView>
    </ScreenContent>
  );
}

export default DataTypesScreen;
