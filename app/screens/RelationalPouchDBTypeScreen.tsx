import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';
import ScreenContent from '@app/components/ScreenContent';
import InsetGroup from '@app/components/InsetGroup';

import schema from '@app/db/schema';
import titleCase from '@app/utils/titleCase';
import useDB from '@app/hooks/useDB';
import { useFocusEffect } from '@react-navigation/native';

function RelationalPouchDBTypeScreen({
  navigation,
  route,
}: StackScreenProps<StackParamList, 'RelationalPouchDBType'>) {
  const rootNavigation = useRootNavigation();
  const { type } = route.params;
  const typeDef = schema[type];
  if (!typeDef) throw new Error(`No such type: ${type}`);

  const { db } = useDB();
  const [data, setData] = useState(null);

  const loadData = useCallback(async () => {
    setData(await db.rel.find(type));
  }, [db.rel, type]);

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
        rootNavigation?.navigate('RelationalPouchDBSave', {
          type,
          defaultContentJson: JSON.stringify(typeDef.sample, null, 2),
        })
      }
    >
      <ScrollView keyboardDismissMode="interactive">
        <InsetGroup>
          {((data && data[typeDef.plural]) || [])
            .flatMap((d: any) => [
              <InsetGroup.Item
                key={d.id}
                arrow
                vertical
                label={d[typeDef.titleField]}
                detail={d.id}
                onPress={() =>
                  navigation.push('RelationalPouchDBTypeDetail', {
                    type,
                    id: d.id,
                  })
                }
              />,
              <InsetGroup.ItemSeperator key={`s-${d.id}`} />,
            ])
            .slice(0, -1)}
        </InsetGroup>
      </ScrollView>
    </ScreenContent>
  );
}

export default RelationalPouchDBTypeScreen;
