// @ts-nocheck

import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '@app/navigation';
import { useFocusEffect } from '@react-navigation/native';
import ModalContent from '@app/components/ModalContent';
import InsetGroup from '@app/components/InsetGroup';
import commonStyles from '@app/utils/commonStyles';

import schema from '@app/db/old_schema';
import useDB from '@app/hooks/useDB';
import { DataTypeWithID, find } from '@app/db/old_relationalUtils';
import titleCase from '@app/utils/titleCase';

function RelationalPouchDBTypeScreen({
  navigation,
  route,
}: StackScreenProps<RootStackParamList, 'RelationalPouchDBTypeDataSelect'>) {
  const { type, callback } = route.params;
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

  const handleSelect = useCallback(
    (id: string) => {
      callback(id);
      navigation.goBack();
    },
    [callback, navigation],
  );

  return (
    <ModalContent navigation={navigation} title={`Select ${titleCase(type)}`}>
      <ScrollView>
        <InsetGroup style={commonStyles.mt16}>
          {data ? (
            data
              .flatMap(d => [
                <InsetGroup.Item
                  key={d.id}
                  vertical
                  label={d[typeDef.titleField]}
                  detail={d.id?.toLowerCase()}
                  onPress={() => handleSelect(d.id || '')}
                />,
                <InsetGroup.ItemSeparator key={`s-${d.id}`} />,
              ])
              .slice(0, -1)
          ) : (
            <InsetGroup.Item disabled label="Loading..." />
          )}
        </InsetGroup>
      </ScrollView>
    </ModalContent>
  );
}

export default RelationalPouchDBTypeScreen;
