import React, { useRef } from 'react';
import { ScrollView } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import type { StackParamList } from '@app/navigation/MainStack';

import ScreenContent from '@app/components/ScreenContent';
import UIGroup from '@app/components/UIGroup';

function FixDataConsistencyErrorScreen({
  navigation,
  route,
}: StackScreenProps<StackParamList, 'FixDataConsistencyError'>) {
  const { error } = route.params;
  const scrollViewRef = useRef<ScrollView>(null);

  return (
    <ScreenContent
      navigation={navigation}
      title="Fix Data Consistency Error"
      headerLargeTitle={false}
    >
      <ScreenContent.ScrollView ref={scrollViewRef}>
        <UIGroup.FirstGroupSpacing />
        <UIGroup>
          <UIGroup.ListItem
            label="ID"
            verticalArrangedLargeTextIOS
            detail={error.id || '(undefined)'}
            monospaceDetail
            adjustsDetailFontSizeToFit
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            label="Raw ID"
            verticalArrangedLargeTextIOS
            detail={error.rawId || '(undefined)'}
            monospaceDetail
            adjustsDetailFontSizeToFit
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            label="Error Message"
            verticalArrangedLargeTextIOS
            detail={
              (error.error instanceof Error
                ? error.error.message
                : undefined) || '(N/A)'
            }
            monospaceDetail
            adjustsDetailFontSizeToFit
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            label="Error JSON"
            verticalArrangedLargeTextIOS
            detail={JSON.stringify(error.error, null, 2)}
            monospaceDetail
            adjustsDetailFontSizeToFit
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            label="Error Trace"
            verticalArrangedLargeTextIOS
            detail={
              (error.error instanceof Error ? error.error.stack : undefined) ||
              '(unknown)'
            }
            monospaceDetail
            adjustsDetailFontSizeToFit
            onPress={() => console.error(error.error)}
          />
        </UIGroup>
      </ScreenContent.ScrollView>
    </ScreenContent>
  );
}

export default FixDataConsistencyErrorScreen;
