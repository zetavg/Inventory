import React, { useState, useEffect, useCallback } from 'react';
import { Alert, RefreshControl, ScrollView, View, Image } from 'react-native';
import { DataTable } from 'react-native-paper';
import ImageView from 'react-native-image-viewing';
import { useFocusEffect } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { StackParamList } from '@app/navigation/MainStack';
import useColors from '@app/hooks/useColors';
import ScreenContent from '@app/components/ScreenContent';
import Text from '@app/components/Text';
import commonStyles from '@app/utils/commonStyles';

import useDB from '@app/hooks/useDB';

import InsetGroup from '@app/components/InsetGroup';
import { addFromImageLibrary } from '@app/features/attachments';
import LoadingOverlay from '@app/components/LoadingOverlay';

function PouchDBAttachmentsScreen({
  navigation,
}: StackScreenProps<StackParamList, 'PouchDBAttachments'>) {
  const { attachmentsDB } = useDB();

  const numberOfItemsPerPageList = [5, 10, 20, 50];
  const [perPage, setPerPage] = React.useState(numberOfItemsPerPageList[0]);
  const [page, setPage] = React.useState<number>(0);

  const [searchText, setSearchText] = useState('');

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
      const results = searchText
        ? await (attachmentsDB as any).search({
            query: searchText,
            fields: ['file_name'],
            language: 'en',
            include_docs: true,
            skip,
            limit,
          })
        : {
            rows: (
              await attachmentsDB.find({
                selector: {
                  $and: [
                    { thumbnail_type: 's128' },
                    { added_at: { $gt: true } },
                  ],
                },
                sort: [{ thumbnail_type: 'desc' }, { added_at: 'desc' }],
                skip,
                limit,
              })
            ).docs.map(doc => ({ doc })),
            total_rows: (await attachmentsDB.allDocs()).total_rows,
          };
      setData(results);
    } catch (e: any) {
      Alert.alert(e?.message);
    } finally {
      setLoading(false);
    }
  }, [attachmentsDB, limit, searchText, skip]);
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

  const handleUpload = useCallback(async () => {
    try {
      setLoading(true);
      await addFromImageLibrary({ attachmentsDB, selectionLimit: 36 });
      handleRefresh();
    } catch (e: any) {
      Alert.alert('Error', `${e.message}`);
      return;
    } finally {
      setLoading(false);
    }
  }, [attachmentsDB, handleRefresh]);

  const [shownImage, setShownImage] = useState<null | string>(null);

  return (
    <ScreenContent
      navigation={navigation}
      title="PouchDB Attachments"
      overlay={<LoadingOverlay show={loading} />}
      showSearch
      onSearchChangeText={setSearchText}
      action1Label="Upload"
      action1SFSymbolName="plus.app.fill"
      action1MaterialIconName="file-upload"
      onAction1Press={handleUpload}
      action2Label="Settings"
      action2SFSymbolName="gearshape.fill"
      action2MaterialIconName="cog"
      onAction2Press={() => {}}
    >
      <ScrollView
        keyboardDismissMode="interactive"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/*<Text>{JSON.stringify(data, null, 2)}</Text>*/}
        {data && data.rows && (
          <InsetGroup>
            {data.rows
              .flatMap(({ doc }: any) => {
                if (!doc) return [<Text>aa</Text>];
                return [
                  <InsetGroup.Item
                    key={doc._id}
                    // onPress={() => setShownImage(imageSourceUri)}
                    onPress={() =>
                      navigation.push('PouchDBAttachment', {
                        id: doc._id.replace(/^thumbnail-[^-]+-/, ''),
                      })
                    }
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}
                    >
                      <Image
                        source={{
                          uri: doc.data,
                        }}
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: 8,
                          marginRight: 16,
                        }}
                      />
                      <Text style={{ flex: 1 }}>{doc.file_name}</Text>
                    </View>
                  </InsetGroup.Item>,
                  <InsetGroup.ItemSeparator key={`s-${doc._id}`} />,
                ];
              })
              .slice(0, -1)}
          </InsetGroup>
        )}

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

        <ImageView
          images={shownImage ? [{ uri: shownImage }] : []}
          imageIndex={0}
          visible={!!shownImage}
          onRequestClose={() => setShownImage(null)}
        />
      </ScrollView>
    </ScreenContent>
  );
}

export default PouchDBAttachmentsScreen;
