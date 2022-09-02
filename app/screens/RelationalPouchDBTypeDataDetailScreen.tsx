import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';
import { useFocusEffect } from '@react-navigation/native';
import ScreenContent from '@app/components/ScreenContent';
import InsetGroup from '@app/components/InsetGroup';
import commonStyles from '@app/utils/commonStyles';
import camelToSnakeCase from '@app/utils/camelToSnakeCase';
import titleCase from '@app/utils/titleCase';

import schema from '@app/db/schema';
import useDB from '@app/hooks/useDB';
import {
  findWithRelations,
  FindWithRelationsReturnedData,
  getDataTypeNameFromRelation,
  getQueryInverseFromRelation,
  getTypeFromRelation,
} from '@app/db/relationalUtils';
import relationDataAdditionalUI from '@app/db/relationDataAdditionalUI';

function RelationalPouchDBTypeDataDetailScreen({
  navigation,
  route,
}: StackScreenProps<StackParamList, 'RelationalPouchDBTypeDataDetail'>) {
  const rootNavigation = useRootNavigation();
  const { type, id, initialTitle } = route.params;
  const typeDef = schema[type];
  if (!typeDef) throw new Error(`No such type: ${type}`);

  const { db } = useDB();
  const [data, setData] = useState<null | FindWithRelationsReturnedData<
    typeof type
  >>(null);

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

  const AdditionalUI = relationDataAdditionalUI[type];

  return (
    <ScreenContent
      navigation={navigation}
      title={
        data?.data
          ? data?.data[typeDef.titleField]
          : initialTitle || titleCase(type)
      }
      action1Label="Edit"
      action1SFSymbolName={(data && 'square.and.pencil') || undefined}
      action1MaterialIconName={(data && 'pencil') || undefined}
      onAction1Press={
        data?.data
          ? () =>
              rootNavigation?.navigate('RelationalPouchDBSave', {
                type,
                initialData: data.data || {},
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
                  <InsetGroup style={commonStyles.mt16}>
                    <InsetGroup.Item vertical2 label="ID" detail={d.id} />
                  </InsetGroup>

                  <InsetGroup>
                    {[
                      ...Object.entries(
                        (typeDef.dataSchema as any).properties || {},
                      ),
                      ...Object.entries(
                        (typeDef.dataSchema as any).optionalProperties || {},
                      ),
                    ]
                      .flatMap(([field, fieldDef]: [string, any]) => [
                        (() => {
                          const relation =
                            typeDef.relations &&
                            (typeDef.relations as any)[field];
                          const relationType =
                            relation && Object.keys(relation)[0];

                          switch (true) {
                            case [
                              'string',
                              'int8',
                              'uint8',
                              'int16',
                              'uint16',
                              'int32',
                              'uint32',
                              'float32',
                              'float64',
                            ].includes(fieldDef.type): {
                              const v = (d as any)[field];
                              const hasValue = v !== undefined && v !== null;
                              return (
                                <InsetGroup.Item
                                  key={field}
                                  vertical2
                                  label={titleCase(field)}
                                  disabled={!hasValue}
                                  detail={(() => {
                                    switch (relationType) {
                                      default:
                                        return hasValue ? v : `(${v})`;
                                    }
                                  })()}
                                />
                              );
                            }

                            default:
                              return (
                                <InsetGroup.Item
                                  key={field}
                                  compactLabel
                                  label={titleCase(field)}
                                  detail={`Unsupported: ${JSON.stringify(
                                    fieldDef,
                                  )}`}
                                />
                              );
                          }
                        })(),
                        <InsetGroup.ItemSeperator key={`s-${field}`} />,
                      ])
                      .slice(0, -1)}
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
                                navigation.push(
                                  'RelationalPouchDBTypeDataDetail',
                                  {
                                    type: dataTypeNameOfRelation,
                                    id: rData.id,
                                  },
                                )
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
                                      initialData: {
                                        [queryInverse as string]: d.id,
                                      },
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

                  {AdditionalUI && <AdditionalUI data={d} />}
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

export default RelationalPouchDBTypeDataDetailScreen;
