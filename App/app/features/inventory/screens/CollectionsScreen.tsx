import React from 'react';
import type { StackScreenProps } from '@react-navigation/stack';

import { useData } from '@app/data';

import type { StackParamList } from '@app/navigation';

import ScreenContent from '@app/components/ScreenContent';
import UIGroup from '@app/components/UIGroup';

import CollectionListItem from '../components/CollectionListItem';

function CollectionsScreen({
  navigation,
}: StackScreenProps<StackParamList, 'Collections'>) {
  const { data } = useData(
    'collection',
    {},
    { sort: [{ __created_at: 'desc' }] },
  );

  return (
    <ScreenContent
      navigation={navigation}
      title="Collections"
      // showSearch
      // onSearchChangeText={setSearchText}
      // action1Label={editing ? 'Done' : 'Add'}
      // action1SFSymbolName={editing ? undefined : 'rectangle.stack.badge.plus'}
      // action1MaterialIconName={editing ? undefined : 'plus'}
      // onAction1Press={() =>
      //   editing ? endEdit() : rootNavigation?.navigate('SaveCollection', {})
      // }
      // TODO: Not supported on Android yet, still need to implement the EditingListView
      // on Android
      // action2SFSymbolName={
      //   orderedData && orderedData.length && !editing
      //     ? 'list.bullet.indent'
      //     : undefined
      // }
      // onAction2Press={
      //   orderedData && orderedData.length > 0 && !editing
      //     ? () => startEdit()
      //     : undefined
      // }
    >
      {(() => {
        // if (orderedData && (editing || editingWithDelayOff)) {
        //   return (
        //     <EditingListView
        //       style={commonStyles.flex1}
        //       editing={editingWithDelayOn}
        //       onItemMove={handleItemMove}
        //       onItemDelete={handleItemDelete}
        //       key={editingListViewKey}
        //     >
        //       {orderedData.map(collection => (
        //         <EditingListView.Item
        //           key={collection.id}
        //           label={collection.name}
        //         />
        //       ))}
        //     </EditingListView>
        //   );
        // }

        return (
          <ScreenContent.ScrollView>
            <UIGroup.FirstGroupSpacing iosLargeTitle />
            <UIGroup>
              {!!data &&
                data.length > 0 &&
                UIGroup.ListItemSeparator.insertBetween(
                  data
                    .map(collection =>
                      collection ? (
                        <CollectionListItem
                          key={collection.__id}
                          collection={collection}
                          reloadCounter={0}
                          onPress={() =>
                            navigation.push('Datum', {
                              type: 'collection',
                              id: collection.__id,
                              preloadedTitle: collection.name,
                            })
                          }
                        />
                      ) : null,
                    )
                    .filter((elem): elem is JSX.Element => !!elem),
                  { forItemWithIcon: true },
                )}
            </UIGroup>
          </ScreenContent.ScrollView>
        );
      })()}
    </ScreenContent>
  );
}

export default CollectionsScreen;
