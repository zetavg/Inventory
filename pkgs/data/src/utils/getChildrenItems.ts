import {
  GetData,
  GetDatum,
  InvalidDataTypeWithID,
  ValidDataTypeWithID,
} from '../types';

export default async function getChildrenItems(
  parentIds: string[],
  {
    getDatum,
    getData,
    loadedItemsMap = new Map(),
    maxDepth = 10,
    currentDepth = 0,
  }: {
    getDatum: GetDatum;
    getData: GetData;
    loadedItemsMap?: Map<
      string,
      ValidDataTypeWithID<'item'> | InvalidDataTypeWithID<'item'>
    >;
    maxDepth?: number;
    currentDepth?: number;
  },
): Promise<
  Record<
    string,
    Array<ValidDataTypeWithID<'item'> | InvalidDataTypeWithID<'item'>>
  >
> {
  if (currentDepth >= maxDepth) return {};

  return (
    await Promise.all(
      parentIds.map(async parentId => {
        const parentItem = await (async () => {
          const itemFromCache = loadedItemsMap.get(parentId);
          if (itemFromCache) return itemFromCache;

          const item = await getDatum('item', parentId);
          if (item) loadedItemsMap.set(parentId, item);

          return item;
        })();
        if (!parentItem) return {};
        if (!parentItem._can_contain_items) return {};

        const contents = await getData(
          'item',
          { container_id: parentId },
          { sort: [{ __created_at: 'asc' }], limit: 99999 },
        );
        const contentsMap: Record<
          string,
          ValidDataTypeWithID<'item'> | InvalidDataTypeWithID<'item'>
        > = Object.fromEntries(contents.map(d => [d.__id, d]));

        const explicitlyOrderedIds = Array.isArray(parentItem.contents_order)
          ? parentItem.contents_order
          : [];
        const explicitlyOrderedIdsSet = new Set(explicitlyOrderedIds);
        const explicitlyOrderedItems = explicitlyOrderedIds
          .map(id => contentsMap[id])
          .filter(it => !!it);

        const notExplicitlyOrderedItems = contents.filter(
          it => !explicitlyOrderedIdsSet.has(it.__id),
        );

        const contentItems = [
          ...explicitlyOrderedItems,
          ...notExplicitlyOrderedItems,
        ];

        for (const it of contentItems) {
          if (it.__id) loadedItemsMap.set(it.__id, it);
        }

        const contentIds = contentItems
          .map(it => it.__id)
          .filter((id): id is NonNullable<typeof id> => !!id);

        return {
          [parentId]: contentItems,
          ...(await getChildrenItems(contentIds, {
            getDatum,
            getData,
            loadedItemsMap,
            maxDepth,
            currentDepth: currentDepth + 1,
          })),
        };
      }),
    )
  ).reduce((obj1, obj2) => ({ ...obj1, ...obj2 }), {});
}
