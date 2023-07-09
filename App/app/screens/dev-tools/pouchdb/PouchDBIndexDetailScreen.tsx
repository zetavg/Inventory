import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert, RefreshControl, ScrollView, Text } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import commonStyles from '@app/utils/commonStyles';

import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';

import useDB from '@app/hooks/useDB';
import useLogger from '@app/hooks/useLogger';

import ScreenContent from '@app/components/ScreenContent';
import UIGroup from '@app/components/UIGroup';

function PouchDBIndexDetailScreen({
  navigation,
  route,
}: StackScreenProps<StackParamList, 'PouchDBIndexDetail'>) {
  const logger = useLogger('PouchDBIndexDetailScreen');
  const { db } = useDB();
  const rootNavigation = useRootNavigation();
  const { index } = route.params;

  const [deleting, setDeleting] = useState(false);
  const handleDeleteIndex = useCallback(() => {
    Alert.alert(
      'Confirmation',
      `Are you sure you want to delete the index "${index.name}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              if (!db) throw new Error('DB is not ready.');
              const { ddoc } = index;
              if (!ddoc) {
                throw new Error(
                  'Index has no ddoc and therefore cannot be deleted.',
                );
              }
              await db.deleteIndex({ ...index, ddoc });
              navigation.goBack();
            } catch (e) {
              logger.error(e, { showAlert: true });
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  }, [db, index, logger, navigation]);

  const scrollViewRef = useRef<ScrollView>(null);
  const { kiaTextInputProps } =
    ScreenContent.ScrollView.useAutoAdjustKeyboardInsetsFix(scrollViewRef);

  return (
    <ScreenContent
      navigation={navigation}
      title={index.name}
      headerLargeTitle={false}
    >
      <ScreenContent.ScrollView ref={scrollViewRef}>
        <UIGroup.FirstGroupSpacing />

        <UIGroup>
          <UIGroup.ListItem
            verticalArrangedLargeTextIOS
            label="name"
            detail={index.name}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            verticalArrangedLargeTextIOS
            label="ddoc"
            detail={index.ddoc === null ? '(null)' : index.ddoc}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            verticalArrangedLargeTextIOS
            label="type"
            detail={index.type}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListItem
            verticalArrangedLargeTextIOS
            label="def"
            // eslint-disable-next-line react/no-unstable-nested-components
            detail={({ textProps }) => (
              <Text
                {...textProps}
                style={[
                  textProps.style,
                  commonStyles.fontMonospaced,
                  commonStyles.fs12,
                ]}
              >
                {JSON.stringify(index.def, null, 2)}
              </Text>
            )}
          />
        </UIGroup>

        <UIGroup loading={deleting}>
          <UIGroup.ListItem
            button
            destructive
            label="Delete Index"
            onPress={handleDeleteIndex}
          />
        </UIGroup>
      </ScreenContent.ScrollView>
    </ScreenContent>
  );
}

export default PouchDBIndexDetailScreen;
