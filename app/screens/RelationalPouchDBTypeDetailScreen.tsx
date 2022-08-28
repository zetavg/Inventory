import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';
import ScreenContent from '@app/components/ScreenContent';
import InsetGroup from '@app/components/InsetGroup';

import schema from '@app/db/schema';
import titleCase from '@app/utils/titleCase';
import camelToSnakeCase from '@app/utils/camelToSnakeCase';
import useDB from '@app/hooks/useDB';
import { useFocusEffect } from '@react-navigation/native';
import {
  findWithRelations,
  FindWithRelationsReturnedData,
  getDataTypeNameFromRelation,
  getQueryInverseFromRelation,
  getTypeFromRelation,
} from '@app/db/relationalUtils';

function RelationalPouchDBTypeDetailScreen({
  navigation,
  route,
}: StackScreenProps<StackParamList, 'RelationalPouchDBTypeDetail'>) {
  const rootNavigation = useRootNavigation();
  const { type, id } = route.params;
  const typeDef = schema[type];
  if (!typeDef) throw new Error(`No such type: ${type}`);

  const { db } = useDB();
  const [data, setData] = useState<null | FindWithRelationsReturnedData>(null);

  const loadData = useCallback(async () => {
    setData(await findWithRelations(db, type as any, id));
  }, [db, id, type]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const handleDelete = useCallback(() => {
    if (!data?.data) return;

    Alert.alert(
      'Confirm',
      `Are you sure you want to delete document "${data.data.id}"?`,
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
              await db.rel.del(type, data.data);
              navigation.goBack();
            } catch (e: any) {
              Alert.alert(e?.message);
            }
          },
        },
      ],
    );
  }, [data, db.rel, navigation, type]);

  return (
    <ScreenContent
      navigation={navigation}
      title={data?.data ? data?.data[typeDef.titleField] : titleCase(type)}
      action1Label="Edit"
      action1SFSymbolName={(data && 'square.and.pencil') || undefined}
      action1MaterialIconName={(data && 'pencil') || undefined}
      onAction1Press={
        data?.data
          ? () =>
              rootNavigation?.navigate('RelationalPouchDBSave', {
                type,
                defaultContentJson: JSON.stringify(data.data, null, 2),
              })
          : undefined
      }
      action2Label={(data && 'Delete') || undefined}
      action2SFSymbolName={(data && 'trash') || undefined}
      action2MaterialIconName={(data && 'delete') || undefined}
      onAction2Press={handleDelete}
    >
      <ScrollView keyboardDismissMode="interactive">
        {data ? (
          data.data ? (
            (() => {
              const d = data.data;

              return (
                <>
                  <InsetGroup>
                    <InsetGroup.Item vertical2 label="ID" detail={d.id} />
                    <InsetGroup.ItemSeperator />
                    <InsetGroup.Item
                      vertical2
                      label="Data"
                      detail={JSON.stringify(d, null, 2)}
                    />
                  </InsetGroup>

                  {Object.entries(typeDef.relations).map(
                    ([field, relationDef]) => {
                      const dataTypeNameOfRelation =
                        getDataTypeNameFromRelation(relationDef);
                      if (!dataTypeNameOfRelation)
                        throw new Error(
                          `Can't get data type name for field "${field}": ${JSON.stringify(
                            relationDef,
                          )}`,
                        );
                      const dataTypeDefOfRelation =
                        schema[dataTypeNameOfRelation];
                      const relationType = getTypeFromRelation(relationDef);
                      const queryInverse =
                        getQueryInverseFromRelation(relationDef);

                      const elements = data
                        .getRelated(field, {
                          arrElementType: dataTypeNameOfRelation,
                        })
                        .flatMap((rData: any) => {
                          return [
                            <InsetGroup.Item
                              key={rData.id}
                              arrow
                              vertical
                              label={rData[dataTypeDefOfRelation.titleField]}
                              detail={rData.id}
                              onPress={() =>
                                navigation.push('RelationalPouchDBTypeDetail', {
                                  type: dataTypeNameOfRelation,
                                  id: rData.id,
                                })
                              }
                            />,
                            <InsetGroup.ItemSeperator key={`s-${rData.id}`} />,
                          ];
                        })
                        .slice(0, -1);

                      return (
                        <InsetGroup
                          key={field}
                          label={`${titleCase(field)} (${titleCase(
                            camelToSnakeCase(
                              Object.keys(relationDef)[0] || '',
                            ).replace('_', ' '),
                          )})`}
                        >
                          {elements.length > 0 ? (
                            elements
                          ) : (
                            <InsetGroup.Item disabled label={`No ${field}`} />
                          )}
                          {relationType === 'hasMany' && queryInverse && (
                            <>
                              <InsetGroup.ItemSeperator />
                              <InsetGroup.Item
                                button
                                label={`Add ${titleCase(
                                  dataTypeNameOfRelation,
                                )}`}
                                onPress={() =>
                                  rootNavigation?.push(
                                    'RelationalPouchDBSave',
                                    {
                                      type: dataTypeNameOfRelation,
                                      defaultContentJson: JSON.stringify(
                                        {
                                          ...dataTypeDefOfRelation.sample,
                                          [queryInverse as string]: d.id,
                                        },
                                        null,
                                        2,
                                      ),
                                    },
                                  )
                                }
                              />
                            </>
                          )}
                        </InsetGroup>
                      );
                    },
                  )}
                </>
              );
            })()
          ) : (
            <InsetGroup>
              <InsetGroup.Item label="Not Found" />
            </InsetGroup>
          )
        ) : null}
      </ScrollView>
    </ScreenContent>
  );
}

export default RelationalPouchDBTypeDetailScreen;
