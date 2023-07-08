import { useCallback, useEffect, useMemo, useState } from 'react';

import { diff } from 'deep-object-diff';

import { useDB } from '@app/db';

import useLogger from '@app/hooks/useLogger';

import schema, { DataType } from '../schema';

type DataTypeWithAdditionalInfo<T extends keyof typeof schema> = DataType<T> & {
  __id: string;
  __type: T;
};

function getDatumFromDoc<T extends keyof typeof schema>(
  type: T,
  doc: PouchDB.Core.ExistingDocument<{}> | null,
  logger: ReturnType<typeof useLogger>,
): DataTypeWithAdditionalInfo<T> | null {
  if (!doc) return null;

  const [typeName, ...idParts] = doc._id.split('-');
  const id = idParts.join('-');
  if (typeName !== type) {
    logger.error(
      `Error parsing "${type}" ID "${doc._id}": document type is ${typeName}`,
      {
        details: JSON.stringify({ doc }, null, 2),
      },
    );
    return null;
  }

  try {
    const parsedDatum = schema[type].parse((doc as any).data);
    return new Proxy(parsedDatum, {
      get: function (target, prop) {
        if (prop === '__type') {
          return type;
        }

        if (prop === '__id') {
          return id;
        }

        if (prop === '__rev') {
          return doc._rev;
        }

        return (target as any)[prop];
      },
    }) as any;
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : JSON.stringify(e, null, 2);
    logger.error(`Error parsing "${type}" ID "${doc._id}": ${errMsg}`, {
      details: JSON.stringify({ doc }, null, 2),
    });
    return null;
  }
}

export default function useData<
  T extends keyof typeof schema,
  CT extends string | ReadonlyArray<string> | Partial<DataType<T>>,
>(
  type: T,
  cond: CT,
  { skip = 0, limit = 20 }: { skip?: number; limit?: number } = {},
): {
  loading: boolean;
  data:
    | null
    | (CT extends string
        ? DataTypeWithAdditionalInfo<T>
        : ReadonlyArray<DataTypeWithAdditionalInfo<T>>);
  reload: () => void;
} {
  const logger = useLogger('useData', type);
  const { db } = useDB();
  const [cCond, setCCond] = useState(cond);
  useEffect(() => {
    switch (true) {
      case Array.isArray(cond): {
        if (cond.length !== cCond.length) {
          setCCond(cond);
          break;
        }
        if (!(cond as any).every((v: any, i: any) => v === (cCond as any)[i])) {
          setCCond(cond);
          break;
        }
        break;
      }
      case typeof cond === 'object': {
        if (Object.keys(diff(cond as any, cCond as any)).length > 0) {
          setCCond(cond);
        }
        break;
      }
      default: {
        if (cond !== cCond) {
          setCCond(cond);
        }
        break;
      }
    }
  }, [cond, cCond]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<
    | null
    | (CT extends string
        ? DataTypeWithAdditionalInfo<T>
        : ReadonlyArray<null | DataTypeWithAdditionalInfo<T>>)
  >(null);
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      switch (true) {
        case Array.isArray(cCond): {
          break;
        }
        case typeof cCond === 'object': {
          const idStartKey = `${type}-`;
          const idEndKey = idStartKey + '\uffff';
          const selector = {
            _id: {
              $gte: idStartKey,
              $lt: idEndKey,
            },
          };

          const response =
            (await db
              ?.find({
                selector,
                skip,
                limit,
              })
              .catch(e => {
                if (e instanceof Error) {
                  e.message = `Error loading "${type}" with ${JSON.stringify(
                    cCond,
                  )}: ${e.message}`;
                }
                logger.error(e, {
                  details: JSON.stringify({ selector }, null, 2),
                });
                return null;
              })) || null;
          setData(
            (response?.docs.map(d =>
              getDatumFromDoc(type, d, logger),
            ) as any) || null,
          );
          break;
        }
        default: {
          const id = cCond;
          const doc = (await db?.get(`${type}-${id}`)) || null;
          setData(getDatumFromDoc(type, doc, logger) as any);
          break;
        }
      }
    } catch (e) {
      logger.error(e);
    } finally {
      setLoading(false);
    }
  }, [cCond, db, limit, logger, skip, type]);
  useEffect(() => {
    loadData();
  }, [loadData]);

  return useMemo(
    () => ({
      loading,
      data: data as any,
      reload: loadData,
    }),
    [data, loadData, loading],
  );
}
