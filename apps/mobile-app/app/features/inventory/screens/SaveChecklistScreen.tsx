import type { StackScreenProps } from '@react-navigation/stack';

import type { RootStackParamList } from '@app/navigation/Navigation';

function SaveChecklistScreen({
  route,
  navigation,
}: StackScreenProps<RootStackParamList, 'SaveChecklist'>) {
  return null;
  // const { initialData } = route.params;

  // const { db } = useDB();
  // const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // const [data, setData] = useState<Partial<DataTypeWithID<'checklist'>>>({
  //   type: 'checklist',
  //   iconName: 'checklist',
  //   iconColor: 'gray',
  //   ...initialData,
  // });

  // const handleOpenSelectIcon = useCallback(
  //   () =>
  //     navigation.navigate('SelectIcon', {
  //       defaultValue: data.iconName as IconName,
  //       callback: iconName => {
  //         setData(d => ({ ...d, iconName }));
  //         setHasUnsavedChanges(true);
  //       },
  //     }),
  //   [data.iconName, navigation],
  // );

  // const [saving, setSaving] = useState(false);
  // const isDone = useRef(false);
  // const handleSave = useCallback(async () => {
  //   setSaving(true);
  //   try {
  //     await save(db, 'checklist', data);
  //     isDone.current = true;
  //     navigation.goBack();
  //   } catch (e: any) {
  //     Alert.alert('Error', e?.message || 'Unknown error');
  //   } finally {
  //     setSaving(false);
  //   }
  // }, [data, db, navigation]);

  // const handleLeave = useCallback(
  //   (confirm: () => void) => {
  //     if (isDone.current) {
  //       confirm();
  //       return;
  //     }

  //     if (saving) return;

  //     Alert.alert(
  //       'Discard changes?',
  //       'The checklist is not saved yet. Are you sure to discard the changes and leave?',
  //       [
  //         { text: "Don't leave", style: 'cancel', onPress: () => {} },
  //         {
  //           text: 'Discard',
  //           style: 'destructive',
  //           onPress: confirm,
  //         },
  //       ],
  //     );
  //   },
  //   [saving],
  // );

  // const scrollViewRef = useRef<ScrollView>(null);
  // useScrollViewContentInsetFix(scrollViewRef);

  // return (
  //   <ModalContent
  //     navigation={navigation}
  //     preventClose={hasUnsavedChanges}
  //     confirmCloseFn={handleLeave}
  //     title={`${data.id ? 'Edit' : 'New'} Checklist`}
  //     action1Label="Save"
  //     action1MaterialIconName="check"
  //     action1Variant="strong"
  //     onAction1Press={handleSave}
  //     action2Label="Cancel"
  //     onAction2Press={saving ? undefined : () => navigation.goBack()}
  //   >
  //     <ScrollView
  //       ref={scrollViewRef}
  //       keyboardDismissMode="interactive"
  //       keyboardShouldPersistTaps="handled"
  //       automaticallyAdjustKeyboardInsets
  //     >
  //       <InsetGroup style={commonStyles.mt16}>
  //         <InsetGroup.Item
  //           compactLabel
  //           label="Name"
  //           detail={
  //             <InsetGroup.TextInput
  //               alignRight
  //               placeholder="Enter Name"
  //               autoCapitalize="words"
  //               returnKeyType="done"
  //               onFocus={() => scrollViewRef?.current?.scrollTo({ y: -9999 })}
  //               value={applyWhitespaceFix(data.name)}
  //               onChangeText={t => {
  //                 setData(d => ({
  //                   ...d,
  //                   name: removeWhitespaceFix(t),
  //                 }));
  //                 setHasUnsavedChanges(true);
  //               }}
  //             />
  //           }
  //         />
  //         <InsetGroup.ItemSeparator />
  //         <InsetGroup.Item
  //           compactLabel
  //           label="Icon"
  //           detail={
  //             <TouchableOpacity onPress={handleOpenSelectIcon}>
  //               <Icon
  //                 name={data.iconName as IconName}
  //                 color={data.iconColor as IconColor}
  //                 showBackground
  //                 size={40}
  //               />
  //             </TouchableOpacity>
  //           }
  //         />
  //       </InsetGroup>

  //       <InsetGroup>
  //         <InsetGroup.Item
  //           compactLabel
  //           vertical2
  //           label="Description"
  //           detail={
  //             <InsetGroup.TextInput
  //               placeholder="Enter description..."
  //               autoCapitalize="sentences"
  //               multiline
  //               scrollEnabled={false}
  //               value={data.description}
  //               onChangeText={t => {
  //                 setData(d => ({
  //                   ...d,
  //                   description: t,
  //                 }));
  //                 setHasUnsavedChanges(true);
  //               }}
  //             />
  //           }
  //         />
  //       </InsetGroup>

  //       <InsetGroup>
  //         <InsetGroup.Item
  //           compactLabel
  //           label="Icon"
  //           detail={
  //             <InsetGroup.ItemDetailButton
  //               label="Select"
  //               onPress={handleOpenSelectIcon}
  //             />
  //           }
  //         >
  //           <TouchableOpacity
  //             style={commonStyles.flex1}
  //             onPress={handleOpenSelectIcon}
  //           >
  //             {data.iconName && (
  //               <View style={[commonStyles.row, commonStyles.alignItemsCenter]}>
  //                 <Icon
  //                   name={data.iconName as IconName}
  //                   color={data.iconColor as IconColor}
  //                   showBackground
  //                   size={40}
  //                 />
  //                 <Text style={[commonStyles.ml12, commonStyles.opacity05]}>
  //                   {data.iconName}
  //                 </Text>
  //               </View>
  //             )}
  //           </TouchableOpacity>
  //         </InsetGroup.Item>
  //         <InsetGroup.ItemSeparator />
  //         <InsetGroup.Item compactLabel label="Icon Color">
  //           <ColorSelect
  //             value={data.iconColor as ColorSelectColor}
  //             onChange={c => {
  //               setData(d => ({
  //                 ...d,
  //                 iconColor: c,
  //               }));
  //               setHasUnsavedChanges(true);
  //             }}
  //           />
  //         </InsetGroup.Item>
  //       </InsetGroup>

  //       {initialData && initialData.id && (
  //         <InsetGroup>
  //           <InsetGroup.Item
  //             button
  //             destructive
  //             label={`Delete "${initialData.name}"`}
  //             onPress={() =>
  //               Alert.alert(
  //                 'Confirm',
  //                 `Are you sure you want to delete item ${initialData.name}?`,
  //                 [
  //                   { text: 'No', style: 'cancel', onPress: () => {} },
  //                   {
  //                     text: 'Delete',
  //                     style: 'destructive',
  //                     onPress: async () => {
  //                       if (!initialData.id) return;

  //                       try {
  //                         await del(db, 'checklist', initialData.id);
  //                         // if (route.params.afterDelete)
  //                         //   route.params.afterDelete();
  //                         navigation.goBack();
  //                       } catch (e: any) {
  //                         Alert.alert(
  //                           `Can't delete ${initialData.name}`,
  //                           e.message,
  //                         );
  //                       }
  //                     },
  //                   },
  //                 ],
  //               )
  //             }
  //           />
  //         </InsetGroup>
  //       )}
  //     </ScrollView>
  //   </ModalContent>
  // );
}

export default SaveChecklistScreen;
