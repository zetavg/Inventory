import useDB from '@app/hooks/useDB';
import { useCallback, useEffect, useState } from 'react';
import {
  DataTypeWithID,
  find,
  findWithRelations,
  FindWithRelationsReturnedData,
} from './relationalUtils';
import { TypeName } from './schema';

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

  if (id) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [data, setData] = useState<FindWithRelationsReturnedData<T> | null>(
      null,
    );
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const loadData = useCallback(async () => {
      const d = await findWithRelations(db, type, id);
      setData(d);
    }, [db, id, type]);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      loadData();
    }, [loadData]);
    return { data, reloadData: loadData };
  } else {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [data, setData] = useState<DataTypeWithID<T>[] | null>(null);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const loadData = useCallback(async () => {
      id;
      const d = await find(db, type);
      setData(d);
    }, [db, id, type]);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      loadData();
    }, [loadData]);
    return { data, reloadData: loadData };
  }
}
