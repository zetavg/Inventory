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
import { useAttachment, remove } from '@app/features/attachments';

function PouchDBAttachmentScreen({
  navigation,
  route,
}: StackScreenProps<StackParamList, 'PouchDBAttachment'>) {
  const id = route.params.id;

  const { attachmentsDB } = useDB();
  const attachment = useAttachment(id);

  const handleRemove = useCallback(() => {
    if (!id) return;

    Alert.alert('Confirm', 'Are you sure you want to remove this attachment?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await remove({ uuid: id, attachmentsDB });
            navigation.goBack();
          } catch (e: any) {
            Alert.alert(e?.message);
          }
        },
      },
    ]);
  }, [attachmentsDB, id, navigation]);

  return (
    <ScreenContent
      navigation={navigation}
      title={id}
      action1Label="Remove"
      action1SFSymbolName="trash"
      action1MaterialIconName="delete"
      onAction1Press={handleRemove}
    >
      <ScrollView>
        <InsetGroup style={commonStyles.mt16}>
          <InsetGroup.Item vertical2 label="ID" detail={id} />
          {attachment && (
            <>
              <InsetGroup.ItemSeperator />
              <InsetGroup.Item
                vertical2
                label="File Name"
                detail={attachment.file_name}
              />
              <InsetGroup.ItemSeperator />
              <InsetGroup.Item
                vertical2
                label="Dimensions"
                detail={
                  attachment.dimensions
                    ? `${attachment.dimensions.width} × ${attachment.dimensions.height}`
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
                    uuid={id}
                    style={commonStyles.mt4}
                    imageStyle={commonStyles.br8}
                  />
                }
              />
              {/*<InsetGroup.ItemSeperator />
              <InsetGroup.Item
                vertical2
                label="Timestamp"
                detail={doc.timestamp ? doc.timestamp : '(undefined)'}
              />*/}
            </>
          )}
        </InsetGroup>
      </ScrollView>
    </ScreenContent>
  );
}

export default PouchDBAttachmentScreen;
