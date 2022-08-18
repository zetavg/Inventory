import React, { useState, useEffect, useCallback } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { DataTable, ActivityIndicator } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';
import type { StackScreenProps } from '@react-navigation/stack';
import type { StackParamList } from '@app/navigation/MainStack';
import useColors from '@app/hooks/useColors';
import ScreenContent from '@app/components/ScreenContent';
import commonStyles from '@app/utils/commonStyles';
import db from '@app/db/pouchdb';

function PouchDBScreen({
  navigation,
}: StackScreenProps<StackParamList, 'PouchDB'>) {
  const rootNavigation = useRootNavigation();

  const numberOfItemsPerPageList = [5, 10, 20, 50];
  const [perPage, setPerPage] = React.useState(numberOfItemsPerPageList[1]);
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
    <ScreenContent
      navigation={navigation}
      title="PouchDB"
      action1Label="Put Data"
      action1SFSymbolName="plus.square.fill"
      action1MaterialIconName="square-edit-outline"
      onAction1Press={() => rootNavigation?.navigate('PouchDBPutDataModal', {})}
      action2Label="Settings"
      action2SFSymbolName="gearshape.fill"
      action2MaterialIconName="cog"
      onAction2Press={() => {}}
    >
      <ScrollView
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
                <DataTable.Row
                  key={d.id}
                  onPress={() => navigation.push('PouchDBItem', { id: d.id })}
                >
                  <DataTable.Cell>{d.id}</DataTable.Cell>
                  {/*<DataTable.Cell>{d.key}</DataTable.Cell>*/}
                  <DataTable.Cell>{JSON.stringify(d.doc)}</DataTable.Cell>
                </DataTable.Row>
              ))}

            <TableLoadingOverlay show={loading} />
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
    </ScreenContent>
  );
}

function TableLoadingOverlay({ show }: { show: boolean }) {
  const { backgroundColor } = useColors();

  return (
    <View
      style={[commonStyles.overlay, commonStyles.centerChildren]}
      pointerEvents={show ? 'auto' : 'none'}
    >
      <View
        style={[
          commonStyles.overlay,
          commonStyles.opacity05,
          show && { backgroundColor },
        ]}
        pointerEvents={show ? 'auto' : 'none'}
      />
      <ActivityIndicator animating={show} hidesWhenStopped size="large" />
    </View>
  );
}

export default PouchDBScreen;
