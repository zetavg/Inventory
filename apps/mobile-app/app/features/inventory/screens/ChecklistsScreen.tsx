import type { StackScreenProps } from '@react-navigation/stack';

import type { StackParamList } from '@app/navigation';

function ChecklistsScreen({
  navigation,
}: StackScreenProps<StackParamList, 'Checklists'>) {
  return null;
  // const rootNavigation = useRootNavigation();

  // const { db } = useDB();
  // const { data, reloadData } = useRelationalData(
  //   'checklist',
  //   useMemo(
  //     () =>
  //       ({
  //         use_index: 'index-type-createdAt',
  //         selector: {
  //           $and: [{ 'data.createdAt': { $exists: true } }],
  //         },
  //         sort: [{ type: 'desc' }, { 'data.createdAt': 'desc' }],
  //       } as const),
  //     [],
  //   ),
  // );
  // const { orderedData, reloadOrder, updateOrder } = useOrderedData({
  //   data,
  //   settingName: 'checklists',
  //   unorderedOnTop: true,
  // });

  // const [searchText, setSearchText] = useState('');
  // const filteredAndOrderedData = useMemo(() => {
  //   if (!searchText) return orderedData;

  //   return orderedData?.filter(d => `${d.name}`.match(searchText));
  // }, [searchText, orderedData]);

  // const [reloadCounter, setReloadCounter] = useState(0);
  // useFocusEffect(
  //   useCallback(() => {
  //     reloadOrder();
  //     reloadData();
  //     setReloadCounter(v => v + 1);
  //   }, [reloadData, reloadOrder]),
  // );

  // const [editing, setEditing] = useState(false);
  // const [editingWithDelayOn, setEditingWithDelayOn] = useState(false);
  // useEffect(() => {
  //   if (!editing) {
  //     setEditingWithDelayOn(false);
  //     return;
  //   }

  //   const timer = setTimeout(() => setEditingWithDelayOn(true), 10);
  //   return () => clearTimeout(timer);
  // }, [editing]);
  // const [editingWithDelayOff, setEditingWithDelayOff] = useState(false);
  // useEffect(() => {
  //   if (editing) {
  //     setEditingWithDelayOff(true);
  //     return;
  //   }

  //   const timer = setTimeout(() => setEditingWithDelayOff(false), 300);
  //   return () => clearTimeout(timer);
  // }, [editing]);
  // const [newOrder, setNewOrder] = useState<string[]>([]);
  // const startEdit = useCallback(() => {
  //   if (!orderedData) return null;
  //   setEditing(true);
  //   setNewOrder(orderedData.map(d => d.id || ''));
  // }, [orderedData]);
  // const endEdit = useCallback(() => {
  //   setEditing(false);
  // }, []);
  // const handleItemMove = useCallback(
  //   ({ from, to }: { from: number; to: number }) => {
  //     if (!editing) return;
  //     const newNewOrder = moveItemInArray(newOrder, from, to);
  //     setNewOrder(newNewOrder);
  //     updateOrder(newNewOrder);
  //   },
  //   [editing, newOrder, updateOrder],
  // );
  // const [editingListViewKey, setEditingListViewKey] = useState(0);
  // const handleItemDelete = useCallback(
  //   async (index: number) => {
  //     const id = newOrder[index];
  //     try {
  //       await del(db, 'checklist', id);
  //     } catch (e: any) {
  //       Alert.alert('Alert', e.message);
  //     } finally {
  //       await reloadData();
  //       setEditingListViewKey(v => v + 1);
  //     }
  //   },
  //   [db, newOrder, reloadData],
  // );

  // return (
  //   <ScreenContent
  //     navigation={navigation}
  //     title="Checklists"
  //     showSearch
  //     onSearchChangeText={setSearchText}
  //     action1Label={editing ? 'Done' : 'Add'}
  //     action1SFSymbolName={editing ? undefined : 'plus.square'}
  //     action1MaterialIconName={editing ? undefined : 'plus'}
  //     onAction1Press={() =>
  //       editing ? endEdit() : rootNavigation?.navigate('SaveChecklist', {})
  //     }
  //     // TODO: Not supported on Android yet, still need to implement the EditingListView
  //     // on Android
  //     action2SFSymbolName={
  //       orderedData && orderedData.length && !editing
  //         ? 'list.bullet.indent'
  //         : undefined
  //     }
  //     onAction2Press={
  //       orderedData && orderedData.length > 0 && !editing
  //         ? () => startEdit()
  //         : undefined
  //     }
  //   >
  //     {(() => {
  //       if (orderedData && (editing || editingWithDelayOff)) {
  //         return (
  //           <EditingListView
  //             style={commonStyles.flex1}
  //             editing={editingWithDelayOn}
  //             onItemMove={handleItemMove}
  //             onItemDelete={handleItemDelete}
  //             key={editingListViewKey}
  //           >
  //             {orderedData.map(checklist => (
  //               <EditingListView.Item
  //                 key={checklist.id}
  //                 label={checklist.name}
  //               />
  //             ))}
  //           </EditingListView>
  //         );
  //       }

  //       return (
  //         <ScrollView keyboardDismissMode="interactive">
  //           <InsetGroup loading={!orderedData}>
  //             {orderedData &&
  //               (orderedData.length > 0 ? (
  //                 filteredAndOrderedData &&
  //                 filteredAndOrderedData?.length > 0 ? (
  //                   filteredAndOrderedData
  //                     .flatMap(checklist => [
  //                       <ChecklistItem
  //                         key={checklist.id}
  //                         reloadCounter={reloadCounter}
  //                         checklist={checklist}
  //                         onPress={() =>
  //                           navigation.push('Checklist', {
  //                             id: checklist.id || '',
  //                             initialTitle: checklist.name,
  //                           })
  //                         }
  //                       />,
  //                       <InsetGroup.ItemSeparator
  //                         key={`s-${checklist.id}`}
  //                         // leftInset={50}
  //                         leftInset={60}
  //                       />,
  //                     ])
  //                     .slice(0, -1)
  //                 ) : (
  //                   <Text style={styles.emptyText}>
  //                     No matching collection.
  //                   </Text>
  //                 )
  //               ) : (
  //                 <Text style={styles.emptyText}>
  //                   You do not have any checklists yet.
  //                   {'\n\n'}
  //                   Checklists can be created to help you check if you have all
  //                   items ready for a specific event or activity, for example,
  //                   camping.
  //                   {'\n\n'}
  //                   Press the add button on the top right to add a checklist.
  //                 </Text>
  //               ))}
  //           </InsetGroup>
  //         </ScrollView>
  //       );
  //     })()}
  //   </ScreenContent>
  // );
}

// const styles = StyleSheet.create({
//   emptyText: {
//     padding: 32,
//     paddingVertical: 64,
//     opacity: 0.5,
//     textAlign: 'center',
//   },
// });

export default ChecklistsScreen;
