import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';

import { remove, useAttachment } from '@app/features/attachments';

import commonStyles from '@app/utils/commonStyles';

import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';

import useDB from '@app/hooks/useDB';

import AttachmentImage from '@app/components/AttachmentImage';
import InsetGroup from '@app/components/InsetGroup';
// import { attachmentsDB } from '@app/db/pouchdb';
import ScreenContent from '@app/components/ScreenContent';
import ViewableImage from '@app/components/ViewableImage';

function PouchDBAttachmentScreen({
  navigation,
  route,
}: StackScreenProps<StackParamList, 'PouchDBAttachment'>) {
  return null;
  // const id = route.params.id;

  // const { attachmentsDB } = useDB();
  // const attachment = useAttachment(id);

  // const handleRemove = useCallback(() => {
  //   if (!id) return;

  //   Alert.alert('Confirm', 'Are you sure you want to remove this attachment?', [
  //     {
  //       text: 'Cancel',
  //       style: 'cancel',
  //     },
  //     {
  //       text: 'Delete',
  //       style: 'destructive',
  //       onPress: async () => {
  //         try {
  //           await remove({ uuid: id, attachmentsDB });
  //           navigation.goBack();
  //         } catch (e: any) {
  //           Alert.alert(e?.message);
  //         }
  //       },
  //     },
  //   ]);
  // }, [attachmentsDB, id, navigation]);

  // return (
  //   <ScreenContent
  //     navigation={navigation}
  //     title={id}
  //     action1Label="Remove"
  //     action1SFSymbolName="trash"
  //     action1MaterialIconName="delete"
  //     onAction1Press={handleRemove}
  //   >
  //     <ScrollView>
  //       <InsetGroup style={commonStyles.mt16}>
  //         <InsetGroup.Item vertical2 label="ID" detail={id} />
  //         {attachment && (
  //           <>
  //             <InsetGroup.ItemSeparator />
  //             <InsetGroup.Item
  //               vertical2
  //               label="File Name"
  //               detail={attachment.file_name}
  //             />
  //             <InsetGroup.ItemSeparator />
  //             <InsetGroup.Item
  //               vertical2
  //               label="Dimensions"
  //               detail={
  //                 attachment.dimensions
  //                   ? `${attachment.dimensions.width} × ${attachment.dimensions.height}`
  //                   : '(undefined)'
  //               }
  //             />
  //             <InsetGroup.ItemSeparator />
  //             <InsetGroup.Item
  //               vertical2
  //               label="Data"
  //               detail={
  //                 <AttachmentImage
  //                   viewable
  //                   uuid={id}
  //                   style={commonStyles.mt4}
  //                   imageStyle={commonStyles.br8}
  //                 />
  //               }
  //             />
  //             {/*<InsetGroup.ItemSeparator />
  //             <InsetGroup.Item
  //               vertical2
  //               label="Timestamp"
  //               detail={doc.timestamp ? doc.timestamp : '(undefined)'}
  //             />*/}
  //           </>
  //         )}
  //       </InsetGroup>
  //     </ScrollView>
  //   </ScreenContent>
  // );
}

export default PouchDBAttachmentScreen;
