import { Database } from '@app/db';
import { getDataFromDocs } from '@app/db/hooks';
import { DataTypeWithID } from '@app/db/relationalUtils';

export default async function getChildrenDedicatedItemIds(
  db: Database,
  parentIds: string[],
  loadedItemsMapRef?: React.MutableRefObject<Map<
    string,
    DataTypeWithID<'item'>
  > | null>,
  maxDepth = 10,
  currentDepth = 0,
): Promise<Record<string, Array<string>>> {
  if (currentDepth >= maxDepth) return {};

  const promises = Promise.all(
    parentIds.map(async id => {
      const use_index = 'index-item-dedicatedContainer';
      const query = {
        selector: {
          $and: [
            { type: 'item' },
            { 'data.dedicatedContainer': id },
            { 'data.createdAt': { $exists: true } },
          ],
        },
        sort: [
          { type: 'asc' },
          { 'data.dedicatedContainer': 'asc' },
          { 'data.createdAt': 'asc' },
        ],
        use_index,
      };

      const { docs } = await db.find(query as any);
      const data = getDataFromDocs('item', docs);
      if (loadedItemsMapRef && loadedItemsMapRef.current) {
        data.forEach(d => loadedItemsMapRef.current?.set(d.id || '', d));
      }
      const ids = data.map(d => d.id || '');
      const orderSettingId = `01${12}-settings/item-${id}-dedicatedContents-order`;
      let orderedIds = [];
      try {
        const d: any = await db.get(orderSettingId);
        if (d && d.data) orderedIds = d.data;
      } catch (e) {
        // TODO: handle errors that are not 404
      }
      const orderedIdsSet = new Set(orderedIds);
      const childrenIds = await getChildrenDedicatedItemIds(
        db,
        data.filter(d => d.isContainer).map(d => d.id || ''),
        loadedItemsMapRef,
        maxDepth,
        currentDepth + 1,
      );

      return {
        [id]: [...orderedIds, ...ids.filter(i => !orderedIdsSet.has(i))],
        ...childrenIds,
      };
    }),
  );

  const objects = await promises;
  const object = objects.reduce((obj1, obj2) => ({ ...obj1, ...obj2 }), {});

  return Object.fromEntries(
    Object.entries(object).filter(([, v]) => v.length > 0),
  );
}
