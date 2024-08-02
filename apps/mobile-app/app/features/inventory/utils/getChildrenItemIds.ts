import { onlyValid } from '@invt/data/utils';

import appLogger from '@app/logger';

import { getGetData } from '@app/data/functions';
import { DataTypeWithAdditionalInfo } from '@app/data/types';

export default async function getChildrenItemIds(
  parentIds: string[],
  {
    db,
    loadedItemsMapRef = { current: null },
    maxDepth = 10,
    currentDepth = 0,
  }: {
    db: PouchDB.Database;
    loadedItemsMapRef?: React.MutableRefObject<Map<
      string,
      DataTypeWithAdditionalInfo<'item'>
    > | null>;
    maxDepth?: number;
    currentDepth?: number;
  },
): Promise<Record<string, Array<string>>> {
  const logger = appLogger.for({ module: 'getChildrenItemIds' });
  const getData = getGetData({ db, logger });

  if (currentDepth >= maxDepth) return {};

  if (loadedItemsMapRef.current === null) {
    loadedItemsMapRef.current = new Map();
  }

  const parentIdsToLoad = parentIds.filter(
    id => !loadedItemsMapRef.current?.has(id),
  );
  if (parentIdsToLoad.length > 0) {
    const newLoadedItems = await getData('item', parentIdsToLoad, {});

    for (const item of onlyValid(newLoadedItems)) {
      if (item.__id) loadedItemsMapRef.current?.set(item.__id, item);
    }
  }
  const parentItems = parentIds
    .map(id => loadedItemsMapRef.current?.get(id))
    .filter((it): it is NonNullable<typeof it> => !!it)
    .filter(it => it._can_contain_items);

  const promises = Promise.all(
    parentItems.map(async parentItem => {
      const loadedData = await getData(
        'item',
        {
          container_id: parentItem.__id,
        },
        {
          sort: [{ __created_at: 'asc' }],
        },
      );
      const data = onlyValid(loadedData);
      data.forEach(d => loadedItemsMapRef.current?.set(d.__id || '', d));
      let ids = data.map(d => d.__id || '');

      const explicitlyOrderedIds = (parentItem.contents_order || []).filter(
        idStr => ids.includes(idStr),
      );
      const notExplicitlyOrderedIds = ids.filter(
        idStr => !explicitlyOrderedIds.includes(idStr),
      );
      ids = [...explicitlyOrderedIds, ...notExplicitlyOrderedIds];

      const nextLevelParents = data
        .filter(d => d._can_contain_items)
        .map(d => d.__id || '');

      const childrenIds =
        nextLevelParents.length > 0
          ? await getChildrenItemIds(nextLevelParents, {
              db,
              loadedItemsMapRef,
              maxDepth,
              currentDepth: currentDepth + 1,
            })
          : {};

      return {
        [parentItem.__id || '']: ids,
        ...childrenIds,
      };
    }),
  );

  const objects = await promises;
  const object = objects.reduce((obj1, obj2) => ({ ...obj1, ...obj2 }), {});

  return object;
}
