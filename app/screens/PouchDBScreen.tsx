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
  View,
  TouchableOpacity,
} from 'react-native';
import { DataTable, ActivityIndicator } from 'react-native-paper';
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

function PouchDBScreen({
  navigation,
}: StackScreenProps<StackParamList, 'PouchDB'>) {
  const rootNavigation = useRootNavigation();
  const { iosHeaderTintColor } = useColors();
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => rootNavigation?.navigate('PouchDBPutDataModal', {})}
        >
          <Icon name="ios-add-circle" size={32} color={iosHeaderTintColor} />
        </TouchableOpacity>
      ),
    });
  }, [iosHeaderTintColor, navigation, rootNavigation]);

  const tabBarInsets = useTabBarInsets();
  const { backgroundColor } = useColors();

  const numberOfItemsPerPageList = [5, 10, 20, 50];
  const [perPage, setPerPage] = React.useState(numberOfItemsPerPageList[0]);
  const [page, setPage] = React.useState<number>(0);

  const [data, setData] = useState<PouchDB.Core.AllDocsResponse<{}> | null>(
    null,
  );
  const totalRows = data ? data.total_rows : 0;
  const numberOfPages = Math.ceil(totalRows / perPage);

  const skip = perPage * page;
  const limit = perPage;
  const [loading, setLoading] = useState(true);

  const getData = useCallback(async () => {
    setLoading(true);
    try {
      const results = await db.allDocs({ include_docs: true, skip, limit });
      setData(results);
    } catch (e: any) {
      Alert.alert(e?.message);
    } finally {
      setLoading(false);
    }
  }, [limit, skip]);
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
    } catch (e) {
    } finally {
      setRefreshing(false);
    }
  }, [getData]);

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
        style={[commonStyles.flex1, { backgroundColor }]}
        contentInset={{ bottom: tabBarInsets.scrollViewBottom }}
        scrollIndicatorInsets={{ bottom: tabBarInsets.scrollViewBottom }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>ID</DataTable.Title>
            {/*<DataTable.Title>Key</DataTable.Title>*/}
            <DataTable.Title>Value</DataTable.Title>
          </DataTable.Header>

          <View>
            {data &&
              data.rows.map(d => (
                <DataTable.Row key={d.key}>
                  <DataTable.Cell>{d.id}</DataTable.Cell>
                  {/*<DataTable.Cell>{d.key}</DataTable.Cell>*/}
                  <DataTable.Cell>{JSON.stringify(d.value)}</DataTable.Cell>
                </DataTable.Row>
              ))}

            {loading && <TableLoadingOverlay />}
          </View>

          <DataTable.Pagination
            page={page}
            numberOfPages={numberOfPages}
            onPageChange={p => setPage(p)}
            label={`${skip + 1}-${Math.min(
              skip + perPage,
              totalRows,
            )} of ${totalRows}`}
            selectPageDropdownLabel="Per page:"
            showFastPaginationControls
            numberOfItemsPerPageList={numberOfItemsPerPageList}
            numberOfItemsPerPage={perPage}
            onItemsPerPageChange={setPerPage}
          />
        </DataTable>
      </ScrollView>
    </>
  );
}

function TableLoadingOverlay() {
  const { backgroundColor } = useColors();

  return (
    <View style={[commonStyles.overlay, commonStyles.centerChildren]}>
      <View
        style={[
          commonStyles.overlay,
          commonStyles.opacity05,
          { backgroundColor },
        ]}
      />
      <ActivityIndicator animating size="large" />
    </View>
  );
}

export default PouchDBScreen;
