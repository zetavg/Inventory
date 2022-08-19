import React, { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  Image,
  ImageBackground,
} from 'react-native';
import useDB from '@app/hooks/useDB';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';
import { useFocusEffect } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { StackParamList } from '@app/navigation/MainStack';
import commonStyles from '@app/utils/commonStyles';
// import { attachmentsDB } from '@app/db/pouchdb';
import ScreenContent from '@app/components/ScreenContent';
import InsetGroup from '@app/components/InsetGroup';
import AttachmentImage from '@app/components/AttachmentImage';
import ViewableImage from '@app/components/ViewableImage';

function PouchDBAttachmentScreen({
  navigation,
  route,
}: StackScreenProps<StackParamList, 'PouchDBAttachment'>) {
  const { attachmentsDB } = useDB();

  const id = route.params.id;
  const [loading, setLoading] = useState(true);
  const [doc, setDoc] = useState<any>(null);

  const rootNavigation = useRootNavigation();

  const getData = useCallback(async () => {
    setLoading(true);
    try {
      const results = await attachmentsDB.get(id);
      setDoc(results);
    } catch (e: any) {
      Alert.alert(e?.message);
    } finally {
      setLoading(false);
    }
  }, [attachmentsDB, id]);
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
    if (!doc) return;

    Alert.alert(
      'Confirm',
      `Are you sure you want to remove document "${doc._id}"?`,
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
              await attachmentsDB.remove(doc._id, doc._rev);
              navigation.goBack();
            } catch (e: any) {
              Alert.alert(e?.message);
            }
          },
        },
      ],
    );
  }, [attachmentsDB, doc, navigation]);

  const imageSourceUri = doc && `data:${doc.content_type};base64,${doc.data}`;

  return (
    <ScreenContent
      navigation={navigation}
      title={id}
      action1Label={(doc && 'Remove') || undefined}
      action1SFSymbolName={(doc && 'trash') || undefined}
      action1MaterialIconName={(doc && 'delete') || undefined}
      onAction1Press={handleRemove}
    >
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <InsetGroup style={commonStyles.mt16}>
          <InsetGroup.Item vertical2 label="ID" detail={id} />
          {doc && (
            <>
              <InsetGroup.ItemSeperator />
              <InsetGroup.Item
                vertical2
                label="File Name"
                detail={doc.filename}
              />
              <InsetGroup.ItemSeperator />
              <InsetGroup.Item
                vertical2
                label="Dimensions"
                detail={
                  doc.dimensions
                    ? `${doc.dimensions.width} × ${doc.dimensions.height}`
                    : '(undefined)'
                }
              />
              <InsetGroup.ItemSeperator />
              <InsetGroup.Item
                vertical2
                label="Data"
                detail={
                  <AttachmentImage
                    viewable
                    doc={doc}
                    style={commonStyles.mt4}
                    imageStyle={commonStyles.br8}
                  />
                }
              />
              <InsetGroup.ItemSeperator />
              <InsetGroup.Item
                vertical2
                label="Timestamp"
                detail={doc.timestamp ? doc.timestamp : '(undefined)'}
              />
              <InsetGroup.ItemSeperator />
              <InsetGroup.Item
                vertical2
                label="Thumbnail (128)"
                detail={
                  doc.thumbnail128 ? (
                    <ViewableImage
                      source={{ uri: doc.thumbnail128 }}
                      style={[
                        commonStyles.mt4,
                        commonStyles.br8,
                        { width: 128, height: 128 },
                      ]}
                    />
                  ) : (
                    '(undefined)'
                  )
                }
              />
              <InsetGroup.ItemSeperator />
              <InsetGroup.Item
                vertical2
                label="Thumbnail (64)"
                detail={
                  doc.thumbnail64 ? (
                    <ViewableImage
                      source={{ uri: doc.thumbnail64 }}
                      style={[
                        commonStyles.mt4,
                        commonStyles.br8,
                        { width: 64, height: 64 },
                      ]}
                    />
                  ) : (
                    '(undefined)'
                  )
                }
              />
            </>
          )}
        </InsetGroup>
      </ScrollView>
    </ScreenContent>
  );
}

export default PouchDBAttachmentScreen;
