import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { diff } from 'deep-object-diff';

import { PouchDB, useDB } from '@app/db';

import useLogger from '@app/hooks/useLogger';

import {
  getDataIdFromPouchDbId,
  getDataTypeSelector,
  getPouchDbId,
} from '../pouchdb-utils';
import {
  DataRelationName,
  DataRelationType,
  DataTypeWithRelationDefsName,
  relation_definitions,
  RelationConfig,
  RelationType,
} from '../relations';
import schema, { DataType, DataTypeName } from '../schema';
import { DataTypeWithAdditionalInfo } from '../types';

import { getDatumFromDoc } from './useData';

export default function useRelated<
  T extends DataTypeWithRelationDefsName,
  N extends DataRelationName<T>,
>(
  d: DataTypeWithAdditionalInfo<T> | null,
  relationName: N,
  {
    disable = false,
  }: {
    disable?: boolean;
  } = {},
): {
  loading: boolean;
  data: null | DataRelationType<T, N>;
  refresh: () => void;
  refreshing: boolean;
  relatedTypeName: DataTypeName | null;
  foreignKey: string | null;
} {
  const logger = useLogger('useRelated', d?.__type);
  const { db } = useDB();

  const [cachedD, setCachedD] = useState(d);
  useEffect(() => {
    if (d?.__id !== cachedD?.__id || d?.__rev !== cachedD?.__rev) {
      setCachedD(d);
      return;
    }
    // if (Object.keys(diff(d as any, cachedD as any)).length > 0) {
    //   setCachedD(d);
    // }
  }, [d, cachedD]);

  const type = cachedD?.__type;
  const [relationType, relationConfig] = useMemo((): [
    RelationType | null,
    RelationConfig | null,
  ] => {
    if (!type) return [null, null];
    const relD = relation_definitions[type] as any;

    if (relD.belongs_to) {
      if (relD.belongs_to[relationName]) {
        return ['belongs_to', relD.belongs_to[relationName]];
      }
    }

    if (relD.has_many) {
      if (relD.has_many[relationName]) {
        return ['has_many', relD.has_many[relationName]];
      }
    }

    throw new Error(
      `Cannot find relation "${String(relationName)}" on defn ${JSON.stringify(
        relD,
      )}`,
    );
  }, [relationName, type]);

  const [loading, setLoading] = useState(false);

  const [data, setData] = useState<null | DataRelationType<T, N>>(null);

  const loadData = useCallback(async () => {
    if (!cachedD) return;
    if (!db) return;
    if (!type) return;
    if (!relationName) return;
    if (!relationConfig) return;

    setLoading(true);
    try {
      switch (relationType) {
        case 'belongs_to': {
          const foreignId = (cachedD as any)[relationConfig.foreign_key];
          if (!foreignId) {
            setData(null);
            break;
          }

          try {
            const doc = await db.get(
              getPouchDbId(relationConfig.type_name, foreignId),
            );

            setData(
              getDatumFromDoc(relationConfig.type_name, doc, logger) as any,
            );
          } catch (e) {
            setData(null);
            if (!(e instanceof Error) || e.message !== 'missing') {
              throw e;
            }
          }

          break;
        }
        case 'has_many': {
          await db.createIndex({
            index: {
              fields: [`data.${relationConfig.foreign_key}`, '_id'],
              // partial_filter_selector: getDataTypeSelector(
              //   relationConfig.type_name,
              // ),
            },
          });

          const findRequest: PouchDB.Find.FindRequest<{}> = {
            selector: {
              [`data.${relationConfig.foreign_key}`]: cachedD.__id,
              ...getDataTypeSelector(relationConfig.type_name),
            },
          };
          const response =
            (await db.find(findRequest).catch(e => {
              if (e instanceof Error) {
                e.message = `Error loading ${relationType} relation "${String(
                  relationName,
                )}" of "${cachedD.__type}": ${e.message}`;
              }
              logger.error(e, {
                details: JSON.stringify(
                  { findRequest, data: cachedD },
                  null,
                  2,
                ),
              });
              return null;
            })) || null;
          setData(
            (
              response?.docs.map(ddd =>
                getDatumFromDoc(relationConfig.type_name, ddd, logger),
              ) as any
            ).filter((dddd: any) => !!dddd) || null,
          );
          break;
        }
      }
    } catch (e) {
      logger.error(e);
    } finally {
      setLoading(false);
    }
  }, [cachedD, db, logger, relationConfig, relationName, relationType, type]);

  useFocusEffect(
    useCallback(() => {
      if (disable) return;
      loadData();
    }, [disable, loadData]),
  );

  const [refreshing, setRefreshing] = useState(false);
  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      loadData();
    } catch (e) {
      logger.error(e);
    } finally {
      setRefreshing(false);
    }
  }, [loadData, logger]);

  return useMemo(
    () => ({
      loading,
      data: data as any,
      reload: loadData,
      refresh,
      refreshing,
      relatedTypeName: relationConfig?.type_name || null,
      foreignKey: relationConfig?.foreign_key || null,
    }),
    [
      data,
      loadData,
      loading,
      refresh,
      refreshing,
      relationConfig?.type_name,
      relationConfig?.foreign_key,
    ],
  );
}
