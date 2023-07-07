import React, { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';

import commonStyles from '@app/utils/commonStyles';

import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';

import useDB from '@app/hooks/useDB';

import ScreenContent from '@app/components/ScreenContent';
import ScreenContentScrollView from '@app/components/ScreenContentScrollView';
import UIGroup from '@app/components/UIGroup';

function PouchDBItemScreen({
  navigation,
  route,
}: StackScreenProps<StackParamList, 'PouchDBItem'>) {
  const { db } = useDB();
  const id = route.params.id;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<
    (PouchDB.Core.IdMeta & PouchDB.Core.GetMeta) | null
  >(null);

  const rootNavigation = useRootNavigation();

  const getData = useCallback(async () => {
    if (!db) return;
    setLoading(true);
    try {
      const results = await db.get(id);
      setData(results);
    } catch (e: any) {
      Alert.alert(e?.message);
    } finally {
      setLoading(false);
    }
  }, [db, id]);
  useEffect(() => {
    getData();
  }, [getData]);
  useFocusEffect(
    useCallback(() => {
      getData();
    }, [getData]),
  );

  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await getData();
    } catch (e: any) {
      Alert.alert(e?.message);
    } finally {
      setRefreshing(false);
    }
  }, [getData]);

  const handleRemove = useCallback(() => {
    if (!data) return;

    Alert.alert(
      'Confirm',
      `Are you sure you want to remove document "${data._id}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!db) {
              Alert.alert('Error', 'Database is not available.');
              return;
            }
            try {
              await db.remove(data._id, data._rev);
              navigation.goBack();
            } catch (e: any) {
              Alert.alert(e?.message);
            }
          },
        },
      ],
    );
  }, [data, db, navigation]);

  const jsonDataWithoutId = (() => {
    if (!data) return undefined;

    const { _id: _, ...d } = data;
    return JSON.stringify(d, null, 2);
  })();

  return (
    <ScreenContent
      navigation={navigation}
      title={id}
      action1Label={(data && 'Edit') || undefined}
      action1SFSymbolName={(data && 'square.and.pencil') || undefined}
      action1MaterialIconName={(data && 'pencil') || undefined}
      onAction1Press={() =>
        rootNavigation?.navigate('PouchDBPutDataModal', {
          id,
          jsonData: jsonDataWithoutId,
        })
      }
      action2Label={(data && 'Remove') || undefined}
      action2SFSymbolName={(data && 'trash') || undefined}
      action2MaterialIconName={(data && 'delete') || undefined}
      onAction2Press={handleRemove}
    >
      <ScreenContentScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={commonStyles.mt16} />
        <UIGroup loading={loading}>
          <UIGroup.ListTextInputItem
            label="ID"
            value={id}
            small
            monospaced
            showSoftInputOnFocus={false}
          />
          {data && (
            <>
              <UIGroup.ListItemSeparator />
              <UIGroup.ListTextInputItem
                label="Data"
                value={JSON.stringify(data, null, 2)}
                multiline
                small
                monospaced
                showSoftInputOnFocus={false}
              />
            </>
          )}
        </UIGroup>
      </ScreenContentScrollView>
    </ScreenContent>
  );
}

export default PouchDBItemScreen;
