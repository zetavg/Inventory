import PouchDB from 'pouchdb';

import { NYAN_CAT_PNG } from '../__fixtures__/sample-data';
import CouchDBData from '../CouchDBData';
import { Context } from '../functions/types';

PouchDB.plugin(require('pouchdb-find'));
const openDatabase = require('websql');
const SQLiteAdapter = require('pouchdb-adapter-react-native-sqlite/lib')({
  openDatabase,
});
PouchDB.plugin(SQLiteAdapter);

const contextSet = new Set();
const getContextID = () => {
  let id = 1;
  while (true) {
    if (!contextSet.has(id)) {
      contextSet.add(id);
      return id;
    }
    id += 1;
  }
};
const releaseContextID = (id: number) => {
  contextSet.delete(id);
};
async function withContext(fn: (c: Context) => Promise<void>) {
  const contextID = getContextID();
  const db = new PouchDB(`.temp_dbs/pouchdb-test-views-${contextID}`, {
    adapter: 'react-native-sqlite',
  });

  const context: Context = {
    dbType: 'pouchdb',
    db,
    logger: null,
    logLevels: () => [],
  };

  try {
    const d = new CouchDBData(context);
    await d.updateConfig({});
    await fn(context);
  } finally {
    await db.destroy();
    releaseContextID(contextID);
  }
}

describe('db_images_size', () => {
  it('returns the total size of the images stored in DB', async () => {
    await withContext(async context => {
      const d = new CouchDBData(context);

      expect(await d.getViewData('db_images_size')).toBe(0);

      const image_1 = {
        __type: 'image',
        __id: '1',
      } as const;

      await d.attachAttachmentToDatum(
        image_1,
        'thumbnail-128',
        NYAN_CAT_PNG.content_type,
        NYAN_CAT_PNG.data,
      );
      await d.attachAttachmentToDatum(
        image_1,
        'image-1440',
        NYAN_CAT_PNG.content_type,
        NYAN_CAT_PNG.data,
      );

      await d.saveDatum(image_1);

      expect(await d.getViewData('db_images_size')).toBe(542);

      const image_2 = {
        __type: 'image',
        __id: '2',
      } as const;

      await d.attachAttachmentToDatum(
        image_2,
        'thumbnail-128',
        NYAN_CAT_PNG.content_type,
        NYAN_CAT_PNG.data,
      );
      await d.attachAttachmentToDatum(
        image_2,
        'image-1440',
        NYAN_CAT_PNG.content_type,
        NYAN_CAT_PNG.data,
      );

      await d.saveDatum(image_2);

      expect(await d.getViewData('db_images_size')).toBe(542 * 2);
    });
  });
});

describe('out_of_stock_items_count', () => {
  it('returns the total number of out of stock consumable items', async () => {
    await withContext(async context => {
      const d = new CouchDBData(context);

      expect(await d.getViewData('out_of_stock_items_count')).toBe(0);

      const collection = await d.saveDatum({
        __type: 'collection',
        name: 'Collection',
        icon_name: 'box',
        icon_color: 'gray',
        collection_reference_number: '1',
      });

      await d.saveDatum({
        __type: 'item',
        collection_id: collection.__id,
        name: 'Item',
        icon_name: 'cube-outline',
        icon_color: 'gray',
        item_type: 'consumable',
        consumable_stock_quantity: 0,
      });

      expect(await d.getViewData('out_of_stock_items_count')).toBe(1);

      // This is not out of stock since consumable_stock_quantity defaults to 1
      const item_2 = await d.saveDatum({
        __type: 'item',
        collection_id: collection.__id,
        name: 'Item',
        icon_name: 'cube-outline',
        icon_color: 'gray',
        item_type: 'consumable',
      });

      expect(await d.getViewData('out_of_stock_items_count')).toBe(1);

      // Make it out of stock
      await d.saveDatum({
        ...item_2,
        consumable_stock_quantity: 0,
      });

      expect(await d.getViewData('out_of_stock_items_count')).toBe(2);
    });
  });

  it('does not count items marked as will not restock', async () => {
    await withContext(async context => {
      const d = new CouchDBData(context);

      expect(await d.getViewData('out_of_stock_items_count')).toBe(0);

      const collection = await d.saveDatum({
        __type: 'collection',
        name: 'Collection',
        icon_name: 'box',
        icon_color: 'gray',
        collection_reference_number: '1',
      });

      const item = await d.saveDatum({
        __type: 'item',
        collection_id: collection.__id,
        name: 'Item',
        icon_name: 'cube-outline',
        icon_color: 'gray',
        item_type: 'consumable',
        consumable_stock_quantity: 0,
      });

      expect(await d.getViewData('out_of_stock_items_count')).toBe(1);

      await d.saveDatum({
        ...item,
        consumable_will_not_restock: true, // will not restock
      });

      expect(await d.getViewData('out_of_stock_items_count')).toBe(0);
    });
  });
});

describe('out_of_stock_items', () => {
  it('returns out of stock consumable items', async () => {
    await withContext(async context => {
      const d = new CouchDBData(context);

      expect(await d.getViewData('out_of_stock_items')).toStrictEqual([]);

      const collection = await d.saveDatum({
        __type: 'collection',
        name: 'Collection',
        icon_name: 'box',
        icon_color: 'gray',
        collection_reference_number: '1',
      });

      await d.saveDatum({
        __type: 'item',
        __id: '1',
        collection_id: collection.__id,
        name: 'Item',
        icon_name: 'cube-outline',
        icon_color: 'gray',
        item_type: 'consumable',
        consumable_stock_quantity: 0,
      });

      expect(
        (await d.getViewData('out_of_stock_items'))?.map(it => it.id).sort(),
      ).toStrictEqual(['item-1'].sort());

      // This is not out of stock since consumable_stock_quantity defaults to 1
      const item_2 = await d.saveDatum({
        __type: 'item',
        __id: '2',
        collection_id: collection.__id,
        name: 'Item',
        icon_name: 'cube-outline',
        icon_color: 'gray',
        item_type: 'consumable',
      });

      expect(
        (await d.getViewData('out_of_stock_items'))?.map(it => it.id).sort(),
      ).toStrictEqual(['item-1'].sort());

      // Make it out of stock
      await d.saveDatum({
        ...item_2,
        consumable_stock_quantity: 0,
      });

      expect(
        (await d.getViewData('out_of_stock_items'))?.map(it => it.id).sort(),
      ).toStrictEqual(['item-1', 'item-2'].sort());
    });
  });

  it('does not count items marked as will not restock', async () => {
    await withContext(async context => {
      const d = new CouchDBData(context);

      expect(await d.getViewData('out_of_stock_items')).toStrictEqual([]);

      const collection = await d.saveDatum({
        __type: 'collection',
        name: 'Collection',
        icon_name: 'box',
        icon_color: 'gray',
        collection_reference_number: '1',
      });

      const item = await d.saveDatum({
        __type: 'item',
        __id: '1',
        collection_id: collection.__id,
        name: 'Item',
        icon_name: 'cube-outline',
        icon_color: 'gray',
        item_type: 'consumable',
        consumable_stock_quantity: 0,
      });

      expect(
        (await d.getViewData('out_of_stock_items'))?.map(it => it.id).sort(),
      ).toStrictEqual(['item-1'].sort());

      await d.saveDatum({
        ...item,
        consumable_will_not_restock: true, // will not restock
      });

      expect(
        (await d.getViewData('out_of_stock_items'))?.map(it => it.id).sort(),
      ).toStrictEqual([].sort());
    });
  });

  it('works with includeDocs', async () => {
    await withContext(async context => {
      const d = new CouchDBData(context);

      expect(await d.getViewData('out_of_stock_items')).toStrictEqual([]);

      const collection = await d.saveDatum({
        __type: 'collection',
        name: 'Collection',
        icon_name: 'box',
        icon_color: 'gray',
        collection_reference_number: '1',
      });

      await d.saveDatum({
        __type: 'item',
        __id: '1',
        collection_id: collection.__id,
        name: 'Item 1',
        icon_name: 'cube-outline',
        icon_color: 'gray',
        item_type: 'consumable',
        consumable_stock_quantity: 0,
      });

      expect(
        (await d.getViewData('out_of_stock_items', { includeDocs: true }))
          ?.map(it => it.data?.__id)
          .sort(),
      ).toStrictEqual(['1'].sort());

      expect(
        (await d.getViewData('out_of_stock_items', { includeDocs: true }))
          ?.map(it => it.data?.name)
          .sort(),
      ).toStrictEqual(['Item 1'].sort());
    });
  });

  it('can be grouped with collection', async () => {
    await withContext(async context => {
      const d = new CouchDBData(context);

      expect(await d.getViewData('out_of_stock_items')).toStrictEqual([]);

      const collection_a = await d.saveDatum({
        __type: 'collection',
        __id: 'a',
        name: 'Collection A',
        icon_name: 'box',
        icon_color: 'gray',
        collection_reference_number: '1',
      });

      await d.saveDatum({
        __type: 'item',
        __id: 'a-1',
        collection_id: collection_a.__id,
        name: 'Item A-1',
        icon_name: 'cube-outline',
        icon_color: 'gray',
        item_type: 'consumable',
        consumable_stock_quantity: 0,
      });

      const collection_b = await d.saveDatum({
        __type: 'collection',
        __id: 'b',
        name: 'Collection B',
        icon_name: 'box',
        icon_color: 'gray',
        collection_reference_number: '2',
      });

      await d.saveDatum({
        __type: 'item',
        __id: 'b-1',
        collection_id: collection_b.__id,
        name: 'Item B-1',
        icon_name: 'cube-outline',
        icon_color: 'gray',
        item_type: 'consumable',
        consumable_stock_quantity: 0,
      });

      await d.saveDatum({
        __type: 'item',
        __id: 'b-2',
        collection_id: collection_b.__id,
        name: 'Item B-2',
        icon_name: 'cube-outline',
        icon_color: 'gray',
        item_type: 'consumable',
        consumable_stock_quantity: 0,
      });

      expect(
        (
          await d.getViewData('out_of_stock_items', {
            startKey: ['a'],
            endKey: ['a', '\ufff0'],
            includeDocs: true,
          })
        )
          ?.map(it => it.data?.name)
          .sort(),
      ).toStrictEqual(['Item A-1'].sort());

      expect(
        (
          await d.getViewData('out_of_stock_items', {
            startKey: ['b'],
            endKey: ['b', '\ufff0'],
            includeDocs: true,
          })
        )
          ?.map(it => it.data?.name)
          .sort(),
      ).toStrictEqual(['Item B-1', 'Item B-2'].sort());
    });
  });
});

describe('expired_items', () => {
  it('returns expired items', async () => {
    await withContext(async context => {
      const d = new CouchDBData(context);

      const nowDate = Date.now();

      expect(
        await d.getViewData('expired_items', {
          descending: true,
          startKey: nowDate,
        }),
      ).toStrictEqual([]);

      const collection = await d.saveDatum({
        __type: 'collection',
        name: 'Collection',
        icon_name: 'box',
        icon_color: 'gray',
        collection_reference_number: '1',
      });

      await d.saveDatum({
        __type: 'item',
        collection_id: collection.__id,
        name: 'Item 1',
        icon_name: 'cube-outline',
        icon_color: 'gray',
        expiry_date: nowDate + 1,
      });

      await d.saveDatum({
        __type: 'item',
        collection_id: collection.__id,
        name: 'Item 2',
        icon_name: 'cube-outline',
        icon_color: 'gray',
        expiry_date: nowDate + 1000,
      });

      await d.saveDatum({
        __type: 'item',
        collection_id: collection.__id,
        name: 'Expired Item 1',
        icon_name: 'cube-outline',
        icon_color: 'gray',
        expiry_date: nowDate - 1,
      });

      await d.saveDatum({
        __type: 'item',
        collection_id: collection.__id,
        name: 'Expired Item 2',
        icon_name: 'cube-outline',
        icon_color: 'gray',
        expiry_date: nowDate - 1000,
      });

      // Most recent expired first
      expect(
        (
          await d.getViewData('expired_items', {
            descending: true,
            startKey: nowDate,
            includeDocs: true,
          })
        )?.map(it => it.data?.name),
      ).toStrictEqual(['Expired Item 1', 'Expired Item 2']);

      // Most old first
      expect(
        (
          await d.getViewData('expired_items', {
            descending: false,
            endKey: nowDate,
            includeDocs: true,
          })
        )?.map(it => it.data?.name),
      ).toStrictEqual(['Expired Item 2', 'Expired Item 1']);
    });
  });

  it('does not count out-of-stock consumable items', async () => {
    await withContext(async context => {
      const d = new CouchDBData(context);

      const nowDate = Date.now();

      expect(
        await d.getViewData('expired_items', {
          descending: true,
          startKey: nowDate,
        }),
      ).toStrictEqual([]);

      const collection = await d.saveDatum({
        __type: 'collection',
        name: 'Collection',
        icon_name: 'box',
        icon_color: 'gray',
        collection_reference_number: '1',
      });

      await d.saveDatum({
        __type: 'item',
        collection_id: collection.__id,
        name: 'Expired Item',
        icon_name: 'cube-outline',
        icon_color: 'gray',
        expiry_date: nowDate - 1,
      });

      const consumable_item = await d.saveDatum({
        __type: 'item',
        collection_id: collection.__id,
        name: 'Consumable Expired Item',
        icon_name: 'cube-outline',
        icon_color: 'gray',
        expiry_date: nowDate - 1000,
        item_type: 'consumable',
        consumable_stock_quantity: 1,
      });

      expect(
        (
          await d.getViewData('expired_items', {
            descending: false,
            endKey: nowDate,
            includeDocs: true,
          })
        )?.map(it => it.data?.name),
      ).toStrictEqual(['Consumable Expired Item', 'Expired Item']);

      await d.saveDatum({
        ...consumable_item,
        consumable_stock_quantity: 0,
      });

      expect(
        (
          await d.getViewData('expired_items', {
            descending: false,
            endKey: nowDate,
            includeDocs: true,
          })
        )?.map(it => it.data?.name),
      ).toStrictEqual(['Expired Item']);
    });
  });
});

describe('rfid_untagged_items_count & rfid_untagged_items', () => {
  it('works', async () => {
    await withContext(async context => {
      const d = new CouchDBData(context);

      expect(await d.getViewData('rfid_untagged_items_count')).toBe(0);
      expect(await d.getViewData('rfid_untagged_items')).toStrictEqual([]);

      const collection = await d.saveDatum({
        __type: 'collection',
        name: 'Collection',
        icon_name: 'box',
        icon_color: 'gray',
        collection_reference_number: '1',
      });

      await d.saveDatum({
        __type: 'item',
        collection_id: collection.__id,
        name: 'Item 1',
        icon_name: 'cube-outline',
        icon_color: 'gray',
        item_reference_number: '1',
      });

      // No item_reference_number, do not expect this to have RFID tag.
      await d.saveDatum({
        __type: 'item',
        collection_id: collection.__id,
        name: 'Item 2',
        icon_name: 'cube-outline',
        icon_color: 'gray',
      });

      expect(await d.getViewData('rfid_untagged_items_count')).toBe(1);
      expect(
        (
          await d.getViewData('rfid_untagged_items', {
            includeDocs: true,
          })
        )
          ?.map(it => it.data?.name)
          .sort(),
      ).toStrictEqual(['Item 1'].sort());
    });
  });
});

describe('rfid_tag_outdated_items_count & rfid_tag_outdated_items', () => {
  it('works', async () => {
    await withContext(async context => {
      const d = new CouchDBData(context);

      expect(await d.getViewData('rfid_tag_outdated_items_count')).toBe(0);
      expect(await d.getViewData('rfid_tag_outdated_items')).toStrictEqual([]);

      const collection = await d.saveDatum({
        __type: 'collection',
        name: 'Collection',
        icon_name: 'box',
        icon_color: 'gray',
        collection_reference_number: '1',
      });

      await d.saveDatum({
        __type: 'item',
        collection_id: collection.__id,
        name: 'Item 1',
        icon_name: 'cube-outline',
        icon_color: 'gray',
        item_reference_number: '1',
        actual_rfid_tag_epc_memory_bank_contents: '0000',
      });

      // Untagged, does not count as outdated.
      await d.saveDatum({
        __type: 'item',
        collection_id: collection.__id,
        name: 'Item 2',
        icon_name: 'cube-outline',
        icon_color: 'gray',
        item_reference_number: '2',
      });

      // No item_reference_number, do not expect this to have RFID tag.
      await d.saveDatum({
        __type: 'item',
        collection_id: collection.__id,
        name: 'Item 3',
        icon_name: 'cube-outline',
        icon_color: 'gray',
      });

      expect(await d.getViewData('rfid_tag_outdated_items_count')).toBe(1);
      expect(
        (
          await d.getViewData('rfid_tag_outdated_items', {
            includeDocs: true,
          })
        )
          ?.map(it => it.data?.name)
          .sort(),
      ).toStrictEqual(['Item 1'].sort());
    });
  });
});

describe('purchase_price_sums', () => {
  it('works', async () => {
    await withContext(async context => {
      const d = new CouchDBData(context);

      expect(await d.getViewData('purchase_price_sums')).toStrictEqual({});

      const collection = await d.saveDatum({
        __type: 'collection',
        name: 'Collection',
        icon_name: 'box',
        icon_color: 'gray',
        collection_reference_number: '1',
      });

      await d.saveDatum({
        __type: 'item',
        collection_id: collection.__id,
        name: 'Item 1',
        icon_name: 'cube-outline',
        icon_color: 'gray',
        purchase_price_currency: 'TWD',
        purchase_price_x1000: 1000 * 1000,
      });

      expect(await d.getViewData('purchase_price_sums')).toStrictEqual({
        TWD: 1000 * 1000,
      });

      await d.saveDatum({
        __type: 'item',
        collection_id: collection.__id,
        name: 'Item 1',
        icon_name: 'cube-outline',
        icon_color: 'gray',
        purchase_price_currency: 'TWD',
        purchase_price_x1000: 2000 * 1000,
      });

      await d.saveDatum({
        __type: 'item',
        collection_id: collection.__id,
        name: 'Item 1',
        icon_name: 'cube-outline',
        icon_color: 'gray',
        purchase_price_currency: 'USD',
        purchase_price_x1000: 100 * 1000,
      });

      expect(await d.getViewData('purchase_price_sums')).toStrictEqual({
        TWD: 3000 * 1000,
        USD: 100 * 1000,
      });
    });
  });
});
