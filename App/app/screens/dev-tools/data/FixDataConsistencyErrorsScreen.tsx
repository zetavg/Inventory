import React, { useRef } from 'react';
import { ScrollView } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import type { StackParamList } from '@app/navigation/MainStack';

import ScreenContent from '@app/components/ScreenContent';
import UIGroup from '@app/components/UIGroup';

function FixDataConsistencyErrorsScreen({
  navigation,
  route,
}: StackScreenProps<StackParamList, 'FixDataConsistencyErrors'>) {
  const { errors } = route.params;
  const scrollViewRef = useRef<ScrollView>(null);

  return (
    <ScreenContent
      navigation={navigation}
      title="Fix Data Consistency Errors"
      headerLargeTitle={false}
    >
      <ScreenContent.ScrollView ref={scrollViewRef}>
        <UIGroup.FirstGroupSpacing />
        <UIGroup>
          {UIGroup.ListItemSeparator.insertBetween(
            errors.map(error => (
              <UIGroup.ListItem
                label={error.id || error.rawId}
                verticalArrangedIOS
                detail={
                  (error.error instanceof Error
                    ? error.error.message
                    : undefined) || JSON.stringify(error)
                }
                navigable
                onPress={() =>
                  navigation.push('FixDataConsistencyError', { error })
                }
              />
            )),
          )}
        </UIGroup>
      </ScreenContent.ScrollView>
    </ScreenContent>
  );
}

export default FixDataConsistencyErrorsScreen;
