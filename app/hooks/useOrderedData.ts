import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import useDB from './useDB';

export default function useOrderedData<T extends { id?: string }>({
  data,
  settingName,
}: {
  data: T[] | null;
  settingName: string;
}): {
  orderedData: T[] | null;
  reloadOrder: () => void;
  updateOrder: (newOrder: string[]) => void;
} {
  const { db } = useDB();
  const settingId = `0100-settings/${settingName}-order`;
  const [orderData, setOrderData] = useState<null | {
    _id: string;
    data: string[];
    _rev?: string;
  }>(null);
  const loadOrder = useCallback(async () => {
    try {
      const d = await db.get(settingId);
      setOrderData({
        data: [],
        ...d,
      });
    } catch (e) {
      setOrderData({ _id: settingId, data: [] });
      // TODO: handle errors that are not 404
    }
  }, [db, settingId]);
  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const orderedData: T[] | null = useMemo(() => {
    if (!data) return null;
    if (!orderData) return null;
    const dataMap: Record<string, T> = Object.fromEntries(
      data.map(d => [d.id, d]),
    );

    return [
      ...orderData.data
        .map((id: string) => {
          const d = dataMap[id];
          delete dataMap[id];
          return d;
        })
        .filter((v: any): v is T => v),
      ...Object.values(dataMap),
    ];
  }, [data, orderData]);

  const updateOrder = useCallback(
    (newOrder: string[]) => {
      db.put({ ...orderData, data: newOrder } as any)
        .then(() => {
          loadOrder();
        })
        .catch((e: any) => {
          Alert.alert('Error', `Error on saving ordered data: ${e}`);
        });
    },
    [db, loadOrder, orderData],
  );

  return { orderedData, reloadOrder: loadOrder, updateOrder };
}
