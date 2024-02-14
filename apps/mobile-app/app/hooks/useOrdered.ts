import { useMemo } from 'react';

export default function useOrdered<T extends { __id?: string }>(
  data: ReadonlyArray<T | null> | null,
  order: ReadonlyArray<string>,
  { unorderedOnTop }: { unorderedOnTop?: boolean } = {},
): [ReadonlyArray<T> | null] {
  const orderedData: T[] | null = useMemo(() => {
    if (!data) return null;

    const filteredData = data.filter((v: any): v is T => v);
    const dataMap: Record<string, T> = Object.fromEntries(
      filteredData.map(d => [d.__id, d]),
    );

    const explicitlyOrderedData = order
      .map((id: string) => {
        const d = dataMap[id];
        return d;
      })
      .filter((v: any): v is T => v);
    const notExplicitlyOrderedData = filteredData.filter(
      d => !order.includes(d.__id || ''),
    );

    if (unorderedOnTop)
      return [...notExplicitlyOrderedData, ...explicitlyOrderedData];

    return [...explicitlyOrderedData, ...notExplicitlyOrderedData];
  }, [data, order, unorderedOnTop]);

  return [orderedData];
}
