import React, { useRef } from 'react';
import { ScrollView } from 'react-native';

import type { StackScreenProps } from '@react-navigation/stack';
import type { StackParamList } from '@app/navigation/MainStack';

import useScrollViewContentInsetFix from '@app/hooks/useScrollViewContentInsetFix';

import ScreenContent from '@app/components/ScreenContent';
import InsetGroup from '@app/components/InsetGroup';
import commonStyles from '@app/utils/commonStyles';

function GenericTextDetailsScreen({
  navigation,
  route,
}: StackScreenProps<StackParamList, 'GenericTextDetails'>) {
  const { title, details } = route.params;

  const scrollViewRef = useRef<ScrollView>(null);
  useScrollViewContentInsetFix(scrollViewRef);

  return (
    <ScreenContent
      navigation={navigation}
      route={route}
      headerLargeTitle={false}
      title={title || 'Details'}
    >
      <ScrollView
        ref={scrollViewRef}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <InsetGroup style={commonStyles.mt16}>
          <InsetGroup.Item vertical2 label="Details" detail={details} />
        </InsetGroup>
      </ScrollView>
    </ScreenContent>
  );
}

export default GenericTextDetailsScreen;
