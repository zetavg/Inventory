import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { StackParamList } from '@app/navigation';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';
import { useFocusEffect } from '@react-navigation/native';
import ScreenContent from '@app/components/ScreenContent';
import InsetGroup from '@app/components/InsetGroup';

import schema from '@app/db/old_schema';
import useDB from '@app/hooks/useDB';
import { DataTypeWithID, find } from '@app/db/old_relationalUtils';
import titleCase from '@app/utils/titleCase';

function RelationalPouchDBTypeScreen({
  navigation,
  route,
}: StackScreenProps<StackParamList, 'RelationalPouchDBType'>) {
  const rootNavigation = useRootNavigation();
  const { type } = route.params;
  const typeDef = schema[type];
  if (!typeDef) throw new Error(`No such type: ${type}`);

  const { db } = useDB();
  const [data, setData] = useState<null | DataTypeWithID<typeof type>[]>(null);

  const loadData = useCallback(async () => {
    const d = await find(db, type);
    setData(d);
  }, [db, type]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  return (
    <ScreenContent
      navigation={navigation}
      title={titleCase(typeDef.plural)}
      action1Label="Add"
      action1SFSymbolName="plus.square.fill"
      action1MaterialIconName="square-edit-outline"
      onAction1Press={() =>
        rootNavigation?.navigate('RelationalPouchDBSave', { type })
      }
    >
      <ScrollView keyboardDismissMode="interactive">
        <InsetGroup>
          {data ? (
            data
              .flatMap(d => [
                <InsetGroup.Item
                  key={d.id}
                  arrow
                  vertical
                  label={d[typeDef.titleField]}
                  detail={d.id}
                  onPress={() =>
                    navigation.push('RelationalPouchDBTypeDataDetail', {
                      type,
                      id: d.id || '',
                      initialTitle: d[typeDef.titleField],
                    })
                  }
                />,
                <InsetGroup.ItemSeparator key={`s-${d.id}`} />,
              ])
              .slice(0, -1)
          ) : (
            <InsetGroup.Item disabled label="Loading..." />
          )}
        </InsetGroup>
      </ScrollView>
    </ScreenContent>
  );
}

export default RelationalPouchDBTypeScreen;
