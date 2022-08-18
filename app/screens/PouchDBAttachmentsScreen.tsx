import React, { useState, useEffect, useCallback } from 'react';
import { Alert, RefreshControl, ScrollView, View, Image } from 'react-native';
import { DataTable, ActivityIndicator } from 'react-native-paper';
import ImageView from 'react-native-image-viewing';
import { launchImageLibrary } from 'react-native-image-picker';
import ImageResizer from 'react-native-image-resizer';
import { useFocusEffect } from '@react-navigation/native';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';
import type { StackScreenProps } from '@react-navigation/stack';
import type { StackParamList } from '@app/navigation/MainStack';
import useColors from '@app/hooks/useColors';
import ScreenContent from '@app/components/ScreenContent';
import Text from '@app/components/Text';
import commonStyles from '@app/utils/commonStyles';
import { attachmentsDB } from '@app/db/pouchdb';

import { v4 as uuidv4 } from 'uuid';
import InsetGroup from '@app/components/InsetGroup';
import base64FromFile from '@app/utils/base64FromFile';

function PouchDBAttachmentsScreen({
  navigation,
}: StackScreenProps<StackParamList, 'PouchDBAttachments'>) {
  const rootNavigation = useRootNavigation();

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
      const results = await (searchText
        ? (attachmentsDB as any).search({
            query: searchText,
            fields: ['name'],
            language: 'en',
            include_docs: true,
            skip,
            limit,
          })
        : attachmentsDB.allDocs({ include_docs: true, skip, limit }));
      setData(results);
    } catch (e: any) {
      Alert.alert(e?.message);
    } finally {
      setLoading(false);
    }
  }, [limit, searchText, skip]);
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
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
      maxWidth: 2048,
      maxHeight: 2048,
      includeBase64: true,
    });

    if (result.didCancel) return;

    if (result.errorCode) {
      Alert.alert('Error', `[${result.errorCode}] ${result.errorMessage}`);
      return;
    }

    const image = result.assets && result.assets[0];
    if (!image) return;
    if (!image.uri) return;
    if (!image.base64) return;

    const filename = image.fileName
      ? uuidv4() + '_' + image.fileName
      : uuidv4();
    const content_type = image.type;

    try {
      // setLoading(true);

      const { uri: thumbnail128Uri } = await ImageResizer.createResizedImage(
        image.uri,
        128,
        128,
        'JPEG',
        100,
        0,
        undefined,
        false,
        { mode: 'cover' },
      );
      const thumbnail128 = `data:image/jpg;base64,${await base64FromFile(
        thumbnail128Uri,
      )}`;

      const { uri: thumbnail64Uri } = await ImageResizer.createResizedImage(
        image.uri,
        64,
        64,
        'JPEG',
        100,
        0,
        undefined,
        false,
        { mode: 'cover' },
      );
      const thumbnail64 = `data:image/jpg;base64,${await base64FromFile(
        thumbnail64Uri,
      )}`;

      await attachmentsDB.put({
        _id: filename,
        filename,
        thumbnail128,
        thumbnail64,
        content_type,
        data: image.base64,
        dimensions: {
          width: image.width,
          height: image.height,
        },
        timestamp: image.timestamp,
      });

      handleRefresh();
    } catch (e: any) {
      Alert.alert('Error', `${e.message}`);
      return;
    } finally {
      // setLoading(false);
    }
  }, [handleRefresh]);

  const [shownImage, setShownImage] = useState<null | string>(null);

  return (
    <ScreenContent
      navigation={navigation}
      title="PouchDB Attachments"
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
        {data && data.rows && (
          <InsetGroup>
            {data.rows
              .flatMap(({ doc }: any) => {
                if (!doc) return [];

                const imageSourceUri = `data:${doc.content_type};base64,${doc.data}`;

                return [
                  <InsetGroup.Item
                    key={doc.filename}
                    // onPress={() => setShownImage(imageSourceUri)}
                    onPress={() =>
                      navigation.push('PouchDBAttachment', { id: doc._id })
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
                          uri: doc.thumbnail128 || imageSourceUri,
                        }}
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: 8,
                          marginRight: 16,
                        }}
                      />
                      <Text style={{ flex: 1 }}>{doc.filename}</Text>
                    </View>
                  </InsetGroup.Item>,
                  <InsetGroup.ItemSeperator key={`s-${doc.filename}`} />,
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

export default PouchDBAttachmentsScreen;
