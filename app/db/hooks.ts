import useDB from '@app/hooks/useDB';
import { useCallback, useEffect, useState } from 'react';
import {
  DataTypeWithID,
  find,
  findWithRelations,
  FindWithRelationsReturnedData,
} from './relationalUtils';
import schema, { TypeName } from './schema';

function getDataFromDocs<T extends TypeName>(
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

  if (id) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [data, setData] = useState<FindWithRelationsReturnedData<T> | null>(
      null,
    );
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const loadData = useCallback(async () => {
      // const d = await findWithRelations(db, type, id);
      const doc = await db.get(`${type}-2-${id}`);
      setData(getDataFromDocs(type, [doc])[0] as any);
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
    }, [db, id, type]);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      // loadData();
    }, [loadData]);
    returnData = { data, reloadData: loadData };
  }

  // Only for (type, id)
  const [cachedRelatedData, setCachedRelatedData] = useState<any>({});
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
        if (!selfData) return;
        const doc = await db.get(
          `${relatedDataTypeName}-2-${(selfData as any)[field]}`,
        );
        const idReplaceRegexp = new RegExp(`^${relatedDataTypeName}-[0-9]-`);
        const data = {
          ...doc.data,
          rev: doc._rev,
          id: doc._id.replace(idReplaceRegexp, ''),
        };
        setCachedRelatedData((d: any) => ({ ...d, [field]: [data] }));
      } else if (relationType === 'hasMany') {
        const { queryInverse } = relationData.options;
        const use_index = `index-${relatedDataTypeName}-${queryInverse}`;
        try {
          const { docs } = await db.find({
            selector: {
              $and: [
                { type: relatedDataTypeName },
                { [`data.${queryInverse}`]: id },
              ],
            },
            use_index,
          });
          setCachedRelatedData((d: any) => ({
            ...d,
            [field]: getDataFromDocs(relatedDataTypeName, docs),
          }));
        } catch (e: any) {
          e.message = `Error finding documents using index ${use_index}: ${e.message}`;
          throw e;
        }
      }
    },
    [db, id, returnData.data, type],
  );
  const getRelated = useCallback<
    <T2 extends TypeName>(
      field: string,
      options: { arrElementType?: T2 },
    ) => ReadonlyArray<DataTypeWithID<T2>>
  >(
    field => {
      if (cachedRelatedData[field]) return cachedRelatedData[field];

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
