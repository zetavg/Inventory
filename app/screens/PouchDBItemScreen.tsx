import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';
import { useFocusEffect } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { StackParamList } from '@app/navigation/MainStack';
import useTabBarInsets from '@app/hooks/useTabBarInsets';
import useColors from '@app/hooks/useColors';
import Appbar from '@app/components/Appbar';
import commonStyles from '@app/utils/commonStyles';
import db from '@app/db/pouchdb';
import InsetGroup from '@app/components/InsetGroup';

function PouchDBItemScreen({
  navigation,
  route,
}: StackScreenProps<StackParamList, 'PouchDBItem'>) {
  const id = route.params.id;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<
    (PouchDB.Core.IdMeta & PouchDB.Core.GetMeta) | null
  >(null);

  const tabBarInsets = useTabBarInsets();
  const { iosHeaderTintColor, backgroundColor } = useColors();

  const rootNavigation = useRootNavigation();

  const getData = useCallback(async () => {
    setLoading(true);
    try {
      const results = await db.get(id);
      setData(results);
    } catch (e: any) {
      Alert.alert(e?.message);
    } finally {
      setLoading(false);
    }
  }, [id]);
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
  }, [data, navigation]);

  useLayoutEffect(() => {
    const jsonData = (() => {
      if (!data) return undefined;

      const { _id: _, ...d } = data;
      return JSON.stringify(d, null, 2);
    })();

    navigation.setOptions({
      title: id,
      headerRight: () =>
        data && (
          <>
            <TouchableOpacity
              onPress={() =>
                rootNavigation?.navigate('PouchDBPutDataModal', {
                  id,
                  jsonData,
                })
              }
              style={commonStyles.mr16}
            >
              <Icon
                name="ios-pencil-sharp"
                size={24}
                color={iosHeaderTintColor}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleRemove}>
              <Icon name="ios-trash" size={24} color={iosHeaderTintColor} />
            </TouchableOpacity>
          </>
        ),
    });
  }, [data, handleRemove, id, iosHeaderTintColor, navigation, rootNavigation]);

  return (
    <>
      <Appbar title="PouchDB" navigation={navigation}>
        <Appbar.Action
          icon="square-edit-outline"
          onPress={() => rootNavigation?.navigate('PouchDBPutDataModal', {})}
        />
        <Appbar.Action icon="magnify" onPress={() => {}} />
      </Appbar>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        automaticallyAdjustsScrollIndicatorInsets
        style={[commonStyles.flex1, commonStyles.pt16, { backgroundColor }]}
        contentInset={{ bottom: tabBarInsets.scrollViewBottom }}
        scrollIndicatorInsets={{ bottom: tabBarInsets.scrollViewBottom }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <InsetGroup>
          <InsetGroup.Item vertical2 label="ID" detail={id} />
          {data && (
            <>
              <InsetGroup.ItemSeperator />
              <InsetGroup.Item
                vertical2
                label="Data"
                detail={JSON.stringify(data, null, 2)}
              />
            </>
          )}
        </InsetGroup>
      </ScrollView>
    </>
  );
}

export default PouchDBItemScreen;
