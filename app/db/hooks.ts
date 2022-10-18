import useDB from '@app/hooks/useDB';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DataTypeWithID,
  find,
  findWithRelations,
  FindWithRelationsReturnedData,
} from './relationalUtils';
import schema, { TypeName } from './schema';

// const log = console.log;
const log = (..._args: any) => {};

export function getDataFromDocs<T extends TypeName>(
  type: T,
  docs: any,
): DataTypeWithID<T>[] {
  const idReplaceRegexp = new RegExp(`^${type}-[0-9]-`);
  return docs.map((doc: any) => ({
    ...doc.data,
    rev: doc._rev,
    id: doc._id.replace(idReplaceRegexp, ''),
  }));
}

export function useRelationalData<T1 extends TypeName>(
  type: T1,
): { data: DataTypeWithID<T1>[] | null; reloadData: () => Promise<void> };
export function useRelationalData<T2 extends TypeName>(
  type: T2,
  id: string,
): {
  data: FindWithRelationsReturnedData<T2> | null;
  reloadData: () => Promise<void>;
};
export function useRelationalData<T extends TypeName>(
  type: T,
  id?: string,
): {
  data: DataTypeWithID<T>[] | FindWithRelationsReturnedData<T> | null;
  reloadData: () => Promise<void>;
} {
  const { db } = useDB();
  let returnData: {
    data: DataTypeWithID<T>[] | FindWithRelationsReturnedData<T> | null;
    reloadData: () => Promise<void>;
  };

  const isDataLoading = useRef<boolean>(false);

  // Only for (type, id)
  const [cachedRelatedData, setCachedRelatedData] = useState<any>({});
  const loadRelatedDataRef = useRef<any>(null);
  const cachedRelatedDataKeysRef = useRef<any>(null);
  cachedRelatedDataKeysRef.current = Object.keys(cachedRelatedData);

  if (id) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [data, setData] = useState<FindWithRelationsReturnedData<T> | null>(
      null,
    );
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const loadData = useCallback(async () => {
      if (isDataLoading.current) return;

      try {
        isDataLoading.current = true;
        // const d = await findWithRelations(db, type, id);
        const doc = await db.get(`${type}-2-${id}`);
        setData(getDataFromDocs(type, [doc])[0] as any);

        if (loadRelatedDataRef.current && cachedRelatedDataKeysRef.current) {
          cachedRelatedDataKeysRef.current.forEach((field: any) =>
            loadRelatedDataRef.current(field),
          );
        }
      } catch (e) {
        throw e;
      } finally {
        isDataLoading.current = false;
      }
    }, [db, id, type]);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      loadData();
    }, [loadData]);
    returnData = { data: { data }, reloadData: loadData } as any;
  } else {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [data, setData] = useState<DataTypeWithID<T>[] | null>(null);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const loadData = useCallback(async () => {
      id;

      if (isDataLoading.current) return;

      try {
        isDataLoading.current = true;
        setCachedRelatedData({});
        // const d = await find(db, type);
        // Faster
        setData(
          getDataFromDocs(
            type,
            (
              await db.find({
                selector: {
                  $and: [{ type }],
                },
                use_index: 'index-type',
              })
            ).docs,
          ),
        );
      } catch (e) {
        throw e;
      } finally {
        isDataLoading.current = false;
      }
    }, [db, id, type]);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      loadData();
    }, [loadData]);
    returnData = { data, reloadData: loadData };
  }

  // Only for (type, id)
  const pendingLoadRelatedData = useRef<string[]>([]);
  const relatedDataIsLoading = useRef<Record<string, boolean>>({});
  const loadRelatedData = useCallback(
    async (field: string) => {
      const relation = (schema[type].relations as any)[field];
      if (!relation) return;
      const relationType = Object.keys(relation)[0];
      const relationData = relation[relationType];
      const relatedDataTypeName =
        typeof relationData === 'object' ? relationData.type : relationData;

      if (relationType === 'belongsTo') {
        const selfData = (returnData.data as any)?.data;
        if (!selfData) {
          pendingLoadRelatedData.current.push(field);
          log(`Cannot load ${relationType} ${field} now, added to pending`);
          return;
        }
        if (relatedDataIsLoading.current[field]) {
          log(`Is already loading ${relationType} ${field}, skipping`);
          return;
        }
        relatedDataIsLoading.current[field] = true;
        log(`Start loading ${relationType} ${field}`);
        try {
          const fieldValue = (selfData as any)[field];
          if (!fieldValue) {
            setCachedRelatedData((d: any) => ({ ...d, [field]: [] }));
            return;
          }

          const doc = await db.get(`${relatedDataTypeName}-2-${fieldValue}`);
          const idReplaceRegexp = new RegExp(`^${relatedDataTypeName}-[0-9]-`);
          const data = {
            ...doc.data,
            rev: doc._rev,
            id: doc._id.replace(idReplaceRegexp, ''),
          };
          setCachedRelatedData((d: any) => ({ ...d, [field]: [data] }));
        } catch (e) {
          throw e;
        } finally {
          relatedDataIsLoading.current[field] = false;
        }
      } else if (relationType === 'hasMany') {
        if (relatedDataIsLoading.current[field]) {
          log(`Is already loading ${relationType} ${field}, skipping`);
          return;
        }
        relatedDataIsLoading.current[field] = true;
        log(`Start loading ${relationType} ${field}`);
        try {
          const { queryInverse, sort } = relationData.options;
          const use_index = `index-${relatedDataTypeName}-${queryInverse}`;
          const query = {
            selector: {
              $and: [
                { type: relatedDataTypeName },
                { [`data.${queryInverse}`]: id },
                ...(sort
                  ? [{ [`data.${sort.field}`]: { $exists: true } }]
                  : []),
              ],
            },
            ...(sort
              ? {
                  sort: [
                    { type: sort.order },
                    { [`data.${queryInverse}`]: sort.order },
                    { [`data.${sort.field}`]: sort.order },
                  ],
                }
              : {}),
            use_index,
          };
          try {
            const { docs } = await db.find(query as any);
            setCachedRelatedData((d: any) => ({
              ...d,
              [field]: getDataFromDocs(relatedDataTypeName, docs),
            }));
            return;
          } catch (e: any) {
            e.message = `Error finding documents using index ${use_index}: ${
              e.message
            } Query: ${JSON.stringify(query, null, 2)}.`;
            throw e;
          }
        } catch (e) {
          throw e;
        } finally {
          relatedDataIsLoading.current[field] = false;
        }
      }
    },
    [db, id, returnData.data, type],
  );
  loadRelatedDataRef.current = loadRelatedData;
  useEffect(() => {
    returnData.data;
    const fieldsToLoad = pendingLoadRelatedData.current;
    pendingLoadRelatedData.current = [];
    if (!fieldsToLoad) return;

    log(
      `effect loadRelatedData called on ${!!(returnData.data as any)
        ?.data} with ${fieldsToLoad}`,
    );

    fieldsToLoad.forEach(field => loadRelatedData(field));
  }, [loadRelatedData, returnData.data]);
  const getRelated = useCallback<
    <T2 extends TypeName>(
      field: string,
      options: { arrElementType?: T2 },
    ) => ReadonlyArray<DataTypeWithID<T2>>
  >(
    field => {
      if (cachedRelatedData[field]) {
        log(`getRelated('${field}'): is loaded`);
        return cachedRelatedData[field];
      }

      log(`getRelated('${field}'): not loaded`);
      loadRelatedData(field);

      return null;
    },
    [cachedRelatedData, loadRelatedData],
  );

  if (id && returnData.data) {
    (returnData.data as any).getRelated = getRelated;
  }

  return returnData;
}
