import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  RefreshControl,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import ImageView from 'react-native-image-viewing';

import commonStyles from '@app/utils/commonStyles';
import humanFileSize from '@app/utils/humanFileSize';

import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';

import useDB from '@app/hooks/useDB';

import ScreenContent from '@app/components/ScreenContent';
import ScreenContentScrollView from '@app/components/ScreenContentScrollView';
import UIGroup from '@app/components/UIGroup';

function PouchDBAttachmentScreen({
  navigation,
  route,
}: StackScreenProps<StackParamList, 'PouchDBAttachment'>) {
  const { db } = useDB();
  const { docId, attachmentId, digest, contentType, length } = route.params;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<string | null>(null);

  const rootNavigation = useRootNavigation();

  const getData = useCallback(async () => {
    if (!db) return;
    setLoading(true);
    try {
      const results = (await db.getAttachment(
        docId,
        attachmentId,
      )) as any as string; // db.getAttachment is patched to return a base64 string
      setData(results);
    } catch (e: any) {
      Alert.alert(e?.message);
    } finally {
      setLoading(false);
    }
  }, [db, docId, attachmentId]);
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
      `Are you sure you want to remove attachment "${attachmentId}" in "${docId}"?`,
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
              const doc = await db.get(docId);
              const rev = doc._rev;
              await db.removeAttachment(docId, attachmentId, rev);
              navigation.goBack();
            } catch (e: any) {
              Alert.alert(e?.message);
            }
          },
        },
      ],
    );
  }, [attachmentId, data, db, docId, navigation]);

  return (
    <ScreenContent
      navigation={navigation}
      title={attachmentId}
      // action1Label={(data && 'Edit') || undefined}
      // action1SFSymbolName={(data && 'square.and.pencil') || undefined}
      // action1MaterialIconName={(data && 'pencil') || undefined}
      // onAction1Press={() => {}}
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
            label="Doc ID"
            value={docId}
            small
            monospaced
            multiline
            showSoftInputOnFocus={false}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            label="Attachment ID"
            value={attachmentId}
            small
            monospaced
            multiline
            showSoftInputOnFocus={false}
          />
          {!!digest && (
            <>
              <UIGroup.ListItemSeparator />
              <UIGroup.ListTextInputItem
                label="Digest"
                value={digest}
                small
                monospaced
                multiline
                showSoftInputOnFocus={false}
              />
            </>
          )}
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            label="Content Type"
            value={contentType}
            small
            monospaced
            multiline
            showSoftInputOnFocus={false}
          />
          <UIGroup.ListItemSeparator />
          <UIGroup.ListTextInputItem
            label="Size"
            value={humanFileSize(length)}
            small
            monospaced
            multiline
            showSoftInputOnFocus={false}
          />
          {data && (
            <>
              <UIGroup.ListItemSeparator />
              {(() => {
                switch (true) {
                  case contentType.startsWith('image/'): {
                    return (
                      <UIGroup.ListItem
                        label="Content (image)"
                        verticalArrangedLargeTextIOS
                        // eslint-disable-next-line react/no-unstable-nested-components
                        detail={() => (
                          <Base64Image contentType={contentType} data={data} />
                        )}
                      />
                    );
                  }
                  default: {
                    let raw = data;
                    let truncated = false;
                    if (raw.length > 4096) {
                      raw = raw.slice(0, 4096);
                      truncated = true;
                    }
                    return (
                      <UIGroup.ListTextInputItem
                        label="Content (raw)"
                        value={data + (truncated ? '... (truncated)' : '')}
                        multiline
                        small
                        monospaced
                        showSoftInputOnFocus={false}
                      />
                    );
                  }
                }
              })()}
            </>
          )}
        </UIGroup>
      </ScreenContentScrollView>
    </ScreenContent>
  );
}

function Base64Image({
  contentType,
  data,
}: {
  contentType: string;
  data: string;
}) {
  const [layoutWidth, setLayoutWidth] = useState(0);
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  }>({ width: 100, height: 100 });

  const uri = `data:${contentType};base64,${data}`;

  useEffect(() => {
    Image.getSize(uri, (width, height) => {
      setDimensions({ width, height });
    });
  }, [uri]);

  const handleLayout = useCallback<
    Exclude<React.ComponentProps<typeof Image>['onLayout'], undefined>
  >(event => {
    const { width: w } = event.nativeEvent.layout;
    setLayoutWidth(w);
  }, []);

  const [imageViewVisible, setImageViewVisible] = useState(false);
  const openImageView = useCallback(() => setImageViewVisible(true), []);
  const closeImageView = useCallback(() => setImageViewVisible(false), []);

  return (
    <>
      <TouchableOpacity onPress={openImageView}>
        <Image
          // eslint-disable-next-line react-native/no-inline-styles
          style={{
            maxWidth: '100%',
            height: (layoutWidth / dimensions.width) * dimensions.height,
          }}
          source={{
            uri,
            ...dimensions,
          }}
          onLayout={handleLayout}
          resizeMode="contain"
        />
      </TouchableOpacity>
      <ImageView
        images={[{ uri }]}
        imageIndex={0}
        visible={imageViewVisible}
        onRequestClose={closeImageView}
      />
    </>
  );
}

export default PouchDBAttachmentScreen;
