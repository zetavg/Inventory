import appLogger from '@app/logger';

import { DataTypeWithAdditionalInfo, onlyValid } from '@app/data';
import getData from '@app/data/functions/getData';
import getDatum from '@app/data/functions/getDatum';
import { getDatumFromDoc } from '@app/data/pouchdb-utils';

export default async function getChildrenDedicatedItemIds(
  db: PouchDB.Database,
  parentIds: string[],
  loadedItemsMapRef?: React.MutableRefObject<Map<
    string,
    DataTypeWithAdditionalInfo<'item'>
  > | null>,
  maxDepth = 10,
  currentDepth = 0,
): Promise<Record<string, Array<string>>> {
  const logger = appLogger.for({ module: 'getChildrenDedicatedItemIds' });
  if (currentDepth >= maxDepth) return {};

  const promises = Promise.all(
    parentIds.map(async id => {
      // const use_index = 'index-getChildrenDedicatedItemIds-item-container';
      // const query = {
      //   selector: {
      //     $and: [
      //       { type: 'item' },
      //       { 'data.container': id },
      //       { created_at: { $exists: true } },
      //     ],
      //   },
      //   sort: [
      //     { type: 'asc' },
      //     { 'data.container': 'asc' },
      //     { created_at: 'asc' },
      //   ],
      //   use_index,
      // };

      const loadedData = await getData(
        'item',
        {
          container_id: id,
        },
        {
          sort: [{ __created_at: 'asc' }],
        },
        { db, logger },
      );
      const data = onlyValid(loadedData);
      if (loadedItemsMapRef && loadedItemsMapRef.current) {
        data.forEach(d => loadedItemsMapRef.current?.set(d.__id || '', d));
      }
      let ids = data.map(d => d.__id || '');

      try {
        const parent = await getDatum('item', id, { db, logger });
        if (parent.__valid) {
          const explicitlyOrderedIds = (parent.contents_order || []).filter(
            idStr => ids.includes(idStr),
          );
          const notExplicitlyOrderedIds = ids.filter(
            idStr => !explicitlyOrderedIds.includes(idStr),
          );
          ids = [...explicitlyOrderedIds, ...notExplicitlyOrderedIds];
        }
      } catch (e) {}
      const childrenIds = await getChildrenDedicatedItemIds(
        db,
        data.filter(d => d._can_contain_items).map(d => d.__id || ''),
        loadedItemsMapRef,
        maxDepth,
        currentDepth + 1,
      );

      return {
        [id]: ids,
        ...childrenIds,
      };
    }),
  );

  const objects = await promises;
  const object = objects.reduce((obj1, obj2) => ({ ...obj1, ...obj2 }), {});

  // console.log('object', object);

  return Object.fromEntries(
    Object.entries(object).filter(([, v]) => v.length > 0),
  );
}
