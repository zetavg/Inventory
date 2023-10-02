import PouchDB from 'pouchdb';

import { fixDataConsistency } from '@deps/data/utils';
import { ValidationError } from '@deps/data/validation';

import CouchDBData from '../CouchDBData';
import { Context } from '../functions/types';

class NoErrorThrownError extends Error {}

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
  const db = new PouchDB(`.temp_dbs/pouchdb-test-${contextID}`, {
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

describe('saveDatum & getDatum', () => {
  it('works', async () => {
    await withContext(async context => {
      const d = new CouchDBData(context);
      const newCollection = await d.saveDatum({
        __type: 'collection',
        name: 'New Collection',
        icon_name: 'box',
        icon_color: 'gray',
        collection_reference_number: '1',
      });
      const newItem = await d.saveDatum({
        __type: 'item',
        collection_id: newCollection.__id,
        name: 'New Item',
        icon_name: 'box',
        icon_color: 'gray',
        model_name: 'New Item Model',
      });

      expect(
        (await d.getDatum('collection', newCollection.__id || ''))?.name,
      ).toEqual('New Collection');
      expect((await d.getDatum('item', newItem.__id || ''))?.name).toEqual(
        'New Item',
      );

      await d.saveDatum(
        {
          __type: 'item',
          __id: newItem.__id,
          name: 'New Item Updated',
          item_reference_number: '123456',
        },
        { ignoreConflict: true },
      );
      expect((await d.getDatum('item', newItem.__id || ''))?.name).toEqual(
        'New Item Updated',
      );
    });
  });
});

describe('getData', () => {
  describe('with no conditions', () => {
    it('works', async () => {
      await withContext(async context => {
        const d = new CouchDBData(context);
        for (let i = 1; i <= 10; i++) {
          const collection = await d.saveDatum({
            __type: 'collection',
            name: `Collection #${i}`,
            icon_name: 'box',
            icon_color: 'gray',
            collection_reference_number: `${i}`,
          });

          await d.saveDatum({
            __type: 'item',
            collection_id: collection.__id,
            name: `Item #${i}`,
            icon_name: 'box',
            icon_color: 'gray',
          });
        }

        const collections = await d.getData('collection');
        expect(collections).toHaveLength(10);
        expect(collections.map(c => c.name)).toEqual(
          expect.arrayContaining(
            Array.from(new Array(10)).map((_, i) => `Collection #${i + 1}`),
          ),
        );

        const items = await d.getData('item');
        expect(items).toHaveLength(10);
        expect(items.map(c => c.name)).toEqual(
          expect.arrayContaining(
            Array.from(new Array(10)).map((_, i) => `Item #${i + 1}`),
          ),
        );
      });
    });

    it('works with limit and skip', async () => {
      await withContext(async context => {
        const d = new CouchDBData(context);
        for (let i = 1; i <= 8; i++) {
          await d.saveDatum({
            __type: 'collection',
            __id: `${i}`,
            name: `Collection #${i}`,
            icon_name: 'box',
            icon_color: 'gray',
            collection_reference_number: `${i}`,
          });
        }

        const collectionsWithLimit = await d.getData(
          'collection',
          {},
          { limit: 3 },
        );
        expect(collectionsWithLimit).toHaveLength(3);
        expect(collectionsWithLimit.map(c => c.name)).toEqual(
          Array.from(new Array(3)).map((_, i) => `Collection #${i + 1}`),
        );

        const collectionsWithSkip = await d.getData(
          'collection',
          {},
          {
            limit: 4,
            skip: 3,
          },
        );
        expect(collectionsWithSkip).toHaveLength(4);
        expect(collectionsWithSkip.map(c => c.name)).toEqual(
          Array.from(new Array(4)).map((_, i) => `Collection #${i + 4}`),
        );
      });
    });

    it('works with sort', async () => {
      await withContext(async context => {
        const d = new CouchDBData(context);
        for (let i = 1; i <= 10; i++) {
          const collection = await d.saveDatum({
            __type: 'collection',
            name: `Collection #${i}`,
            icon_name: 'box',
            icon_color: 'gray',
            collection_reference_number: `${i}`,
            __created_at: 11 - i,
          });

          await d.saveDatum({
            __type: 'item',
            collection_id: collection.__id,
            name: `Item #${i}`,
            icon_name: 'box',
            icon_color: 'gray',
            __created_at: 21 - i,
          });
        }

        const collections = await d.getData(
          'collection',
          {},
          { sort: [{ __created_at: 'desc' }] },
        );
        expect(collections).toHaveLength(10);
        expect(collections.map(c => c.__created_at)).toEqual(
          Array.from(new Array(10)).map((_, i) => 10 - i),
        );

        const items = await d.getData(
          'item',
          {},
          { sort: [{ __created_at: 'asc' }] },
        );
        expect(items).toHaveLength(10);
        expect(items.map(c => c.__created_at)).toEqual(
          Array.from(new Array(10)).map((_, i) => 11 + i),
        );
      });
    });

    it('works with sort and limit and skip', async () => {
      await withContext(async context => {
        const d = new CouchDBData(context);
        for (let i = 1; i <= 10; i++) {
          await d.saveDatum({
            __type: 'collection',
            name: `Collection #${i}`,
            icon_name: 'box',
            icon_color: 'gray',
            collection_reference_number: `${i}`,
          });
        }

        const collectionsWithLimit = await d.getData(
          'collection',
          {},
          { sort: [{ collection_reference_number: 'asc' }], limit: 3 },
        );
        expect(collectionsWithLimit).toHaveLength(3);
        expect(collectionsWithLimit.map(c => c.name)).toEqual(
          Array.from(new Array(3)).map((_, i) => `Collection #${i + 1}`),
        );

        const collectionsWithSkip = await d.getData(
          'collection',
          {},
          {
            sort: [{ collection_reference_number: 'asc' }],
            limit: 4,
            skip: 3,
          },
        );
        expect(collectionsWithSkip).toHaveLength(4);
        expect(collectionsWithSkip.map(c => c.name)).toEqual(
          Array.from(new Array(4)).map((_, i) => `Collection #${i + 4}`),
        );
      });
    });

    it('works with multiple sort', async () => {
      await withContext(async context => {
        const d = new CouchDBData(context);
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
          name: 'Item A2000',
          icon_name: 'box',
          icon_color: 'gray',
          model_name: 'A',
          purchase_price_x1000: 2000,
        });

        await d.saveDatum({
          __type: 'item',
          collection_id: collection.__id,
          name: 'Item C1500',
          icon_name: 'box',
          icon_color: 'gray',
          model_name: 'C',
          purchase_price_x1000: 1500,
        });

        await d.saveDatum({
          __type: 'item',
          collection_id: collection.__id,
          name: 'Item B5000',
          icon_name: 'box',
          icon_color: 'gray',
          model_name: 'B',
          purchase_price_x1000: 5000,
        });

        await d.saveDatum({
          __type: 'item',
          collection_id: collection.__id,
          name: 'Item A1000',
          icon_name: 'box',
          icon_color: 'gray',
          model_name: 'A',
          purchase_price_x1000: 1000,
        });

        await d.saveDatum({
          __type: 'item',
          collection_id: collection.__id,
          name: 'Item C8763',
          icon_name: 'box',
          icon_color: 'gray',
          model_name: 'C',
          purchase_price_x1000: 8763,
        });

        await d.saveDatum({
          __type: 'item',
          collection_id: collection.__id,
          name: 'Item D8000',
          icon_name: 'box',
          icon_color: 'gray',
          model_name: 'D',
          purchase_price_x1000: 8000,
        });

        await d.saveDatum({
          __type: 'item',
          collection_id: collection.__id,
          name: 'Item B2000',
          icon_name: 'box',
          icon_color: 'gray',
          model_name: 'B',
          purchase_price_x1000: 2000,
        });

        await d.saveDatum({
          __type: 'item',
          collection_id: collection.__id,
          name: 'Item A4000',
          icon_name: 'box',
          icon_color: 'gray',
          model_name: 'A',
          purchase_price_x1000: 4000,
        });

        const items_1 = await d.getData(
          'item',
          {},
          { sort: [{ model_name: 'asc' }, { purchase_price_x1000: 'asc' }] },
        );
        expect(items_1.map(it => it.name)).toEqual([
          'Item A1000',
          'Item A2000',
          'Item A4000',
          'Item B2000',
          'Item B5000',
          'Item C1500',
          'Item C8763',
          'Item D8000',
        ]);

        const items_2 = await d.getData(
          'item',
          {},
          { sort: [{ model_name: 'desc' }, { purchase_price_x1000: 'desc' }] },
        );
        expect(items_2.map(it => it.name)).toEqual([
          'Item D8000',
          'Item C8763',
          'Item C1500',
          'Item B5000',
          'Item B2000',
          'Item A4000',
          'Item A2000',
          'Item A1000',
        ]);

        const items_3 = await d.getData(
          'item',
          {},
          { sort: [{ purchase_price_x1000: 'asc' }, { model_name: 'asc' }] },
        );
        expect(items_3.map(it => it.name)).toEqual([
          'Item A1000',
          'Item C1500',
          'Item A2000',
          'Item B2000',
          'Item A4000',
          'Item B5000',
          'Item D8000',
          'Item C8763',
        ]);

        const items_4 = await d.getData(
          'item',
          {},
          { sort: [{ purchase_price_x1000: 'desc' }, { model_name: 'desc' }] },
        );
        expect(items_4.map(it => it.name)).toEqual([
          'Item C8763',
          'Item D8000',
          'Item B5000',
          'Item A4000',
          'Item B2000',
          'Item A2000',
          'Item C1500',
          'Item A1000',
        ]);

        // TODO: test with ['desc', 'asc'] pairs, as this is not currently supported
      });
    });
  });

  describe('with array of IDs', () => {
    it('works', async () => {
      await withContext(async context => {
        const d = new CouchDBData(context);
        for (let i = 1; i <= 10; i++) {
          const collection = await d.saveDatum({
            __type: 'collection',
            __id: `${i}`,
            name: `Collection #${i}`,
            icon_name: 'box',
            icon_color: 'gray',
            collection_reference_number: `${i}`,
          });

          await d.saveDatum({
            __type: 'item',
            __id: `${i}`,
            collection_id: collection.__id,
            name: `Item #${i}`,
            icon_name: 'box',
            icon_color: 'gray',
          });
        }

        const collections = await d.getData('collection', ['1', '1', '8', '4']);
        expect(collections).toHaveLength(4);
        expect(collections.map(c => c.name)).toEqual([
          'Collection #1',
          'Collection #1',
          'Collection #8',
          'Collection #4',
        ]);

        const items = await d.getData('item', ['6', '5', '5', '3', '5']);
        expect(items).toHaveLength(5);
        expect(items.map(c => c.name)).toEqual([
          'Item #6',
          'Item #5',
          'Item #5',
          'Item #3',
          'Item #5',
        ]);
      });
    });

    it('leaves not-found items as invalid', async () => {
      await withContext(async context => {
        const d = new CouchDBData(context);
        for (let i = 1; i <= 10; i++) {
          await d.saveDatum({
            __type: 'collection',
            __id: `${i}`,
            name: `Collection #${i}`,
            icon_name: 'box',
            icon_color: 'gray',
            collection_reference_number: `${i}`,
          });
        }

        const collections = await d.getData('collection', ['1', '0', '2', '4']);
        expect(collections).toHaveLength(4);
        expect(collections.map(c => c.__valid)).toEqual([
          true,
          false,
          true,
          true,
        ]);
        expect(collections.map(c => c.name)).toEqual([
          'Collection #1',
          undefined,
          'Collection #2',
          'Collection #4',
        ]);
      });
    });
  });

  describe('with field match conditions', () => {
    it('works', async () => {
      await withContext(async context => {
        const d = new CouchDBData(context);
        for (let i = 1; i <= 10; i++) {
          const collection = await d.saveDatum({
            __type: 'collection',
            name: `Collection #${i}`,
            icon_name: 'box',
            icon_color: 'gray',
            collection_reference_number: `${i}`,
          });

          await d.saveDatum({
            __type: 'item',
            collection_id: collection.__id,
            name: `Item #${i}`,
            icon_name: 'box',
            icon_color: 'gray',
            model_name: `Model ${i <= 5 ? 'A' : 'B'}`,
          });
        }

        const modelAItems = await d.getData('item', { model_name: 'Model A' });
        expect(modelAItems).toHaveLength(5);
        expect(modelAItems.map(it => it.name)).toEqual(
          expect.arrayContaining(
            Array.from(new Array(5)).map((_, i) => `Item #${i + 1}`),
          ),
        );

        const modelBItems = await d.getData('item', { model_name: 'Model B' });
        expect(modelBItems).toHaveLength(5);
        expect(modelBItems.map(it => it.name)).toEqual(
          expect.arrayContaining(
            Array.from(new Array(5)).map((_, i) => `Item #${i + 6}`),
          ),
        );
      });
    });

    it('works with limit and skip', async () => {
      await withContext(async context => {
        const d = new CouchDBData(context);
        for (let i = 1; i <= 9; i++) {
          const collection = await d.saveDatum({
            __type: 'collection',
            __id: `${i}`,
            name: `Collection #${i}`,
            icon_name: 'box',
            icon_color: 'gray',
            collection_reference_number: `${i}`,
          });

          await d.saveDatum({
            __type: 'item',
            __id: `${i}`,
            collection_id: collection.__id,
            name: `Item #${i}`,
            icon_name: 'box',
            icon_color: 'gray',
            model_name: `Model ${i <= 5 ? 'A' : 'B'}`,
          });
        }

        const modelAItemsWithLimit = await d.getData(
          'item',
          {
            model_name: 'Model A',
          },
          { limit: 3 },
        );
        expect(modelAItemsWithLimit).toHaveLength(3);
        expect(modelAItemsWithLimit.map(it => it.name)).toEqual(
          expect.arrayContaining(
            Array.from(new Array(3)).map((_, i) => `Item #${i + 1}`),
          ),
        );

        const modelBItemsWithSkip = await d.getData(
          'item',
          {
            model_name: 'Model B',
          },
          { limit: 3, skip: 2 },
        );
        expect(modelBItemsWithSkip).toHaveLength(2); // since we only have 9 items
        expect(modelBItemsWithSkip.map(it => it.name)).toEqual(
          expect.arrayContaining(
            Array.from(new Array(2)).map((_, i) => `Item #${i + 8}`),
          ),
        );
      });
    });

    it('works with sort', async () => {
      await withContext(async context => {
        const d = new CouchDBData(context);
        for (let i = 1; i <= 10; i++) {
          const collection = await d.saveDatum({
            __type: 'collection',
            name: `Collection #${i}`,
            icon_name: 'box',
            icon_color: 'gray',
            collection_reference_number: `${i}`,
          });

          await d.saveDatum({
            __type: 'item',
            collection_id: collection.__id,
            name: `Item #${i}`,
            icon_name: 'box',
            icon_color: 'gray',
            model_name: `Model ${i <= 5 ? 'A' : 'B'}`,
            purchase_price_x1000: Math.abs(6 - i) * 1000,
          });
        }

        const items_a = await d.getData(
          'item',
          { model_name: 'Model A' },
          { sort: [{ purchase_price_x1000: 'asc' }] },
        );
        expect(items_a).toHaveLength(5);
        expect(items_a.map(it => it.name)).toEqual(
          Array.from(new Array(5)).map((_, i) => `Item #${5 - i}`),
        );

        const items_b = await d.getData(
          'item',
          { model_name: 'Model B' },
          { sort: [{ purchase_price_x1000: 'desc' }] },
        );
        expect(items_b).toHaveLength(5);
        expect(items_b.map(it => it.name)).toEqual(
          Array.from(new Array(5)).map((_, i) => `Item #${i + 6}`),
        );
      });
    });
  });

  describe('with field exists conditions', () => {
    it('works', async () => {
      await withContext(async context => {
        const d = new CouchDBData(context);

        const collection = await d.saveDatum({
          __type: 'collection',
          name: 'Collection',
          icon_name: 'box',
          icon_color: 'gray',
          collection_reference_number: '1',
        });
        const container = await d.saveDatum({
          __type: 'item',
          collection_id: collection.__id,
          name: 'Container',
          item_type: 'container',
          icon_name: 'box',
          icon_color: 'gray',
        });

        for (let i = 1; i <= 10; i++) {
          await d.saveDatum({
            __type: 'item',
            collection_id: collection.__id,
            name: `Item #${i}`,
            icon_name: 'box',
            icon_color: 'gray',
            container_id: i <= 5 ? container.__id : undefined,
          });
        }

        const itemWithContainer = await d.getData('item', {
          container_id: { $exists: true },
        });
        expect(itemWithContainer).toHaveLength(5);
        expect(itemWithContainer.map(it => it.name)).toEqual(
          expect.arrayContaining(
            Array.from(new Array(5)).map((_, i) => `Item #${i + 1}`),
          ),
        );

        // TODO: Not working
        // const itemWithoutContainer = await d.getData('item', {
        //   container_id: { $exists: false },
        // });
        // expect(itemWithoutContainer).toHaveLength(5);
        // expect(itemWithoutContainer.map(it => it.name)).toEqual(
        //   expect.arrayContaining(
        //     Array.from(new Array(5)).map((_, i) => `Item #${i + 6}`),
        //   ),
        // );
      });
    });
  });

  // TODO: test $gt, ...
});

describe('getDataCount', () => {
  describe('with no conditions', () => {
    it('works', async () => {
      await withContext(async context => {
        const d = new CouchDBData(context);
        for (let i = 1; i <= 10; i++) {
          const collection = await d.saveDatum({
            __type: 'collection',
            name: `Collection #${i}`,
            icon_name: 'box',
            icon_color: 'gray',
            collection_reference_number: `${i}`,
          });

          await d.saveDatum({
            __type: 'item',
            collection_id: collection.__id,
            name: `Item #${i}-1`,
            icon_name: 'box',
            icon_color: 'gray',
          });

          await d.saveDatum({
            __type: 'item',
            collection_id: collection.__id,
            name: `Item #${i}-2`,
            icon_name: 'box',
            icon_color: 'gray',
          });
        }

        const collectionsCount = await d.getDataCount('collection');
        expect(collectionsCount).toEqual(10);

        const itemsCount = await d.getDataCount('item');
        expect(itemsCount).toEqual(20);
      });
    });

    it('works while there are no data', async () => {
      await withContext(async context => {
        const d = new CouchDBData(context);

        const collectionsCount = await d.getDataCount('collection');
        expect(collectionsCount).toEqual(0);

        const itemsCount = await d.getDataCount('item');
        expect(itemsCount).toEqual(0);
      });
    });
  });

  describe('with conditions', () => {
    it('works', async () => {
      await withContext(async context => {
        const d = new CouchDBData(context);

        const collection_1 = await d.saveDatum({
          __type: 'collection',
          name: 'Collection #1',
          icon_name: 'box',
          icon_color: 'gray',
          collection_reference_number: '1',
        });

        const collection_2 = await d.saveDatum({
          __type: 'collection',
          name: 'Collection #2',
          icon_name: 'box',
          icon_color: 'gray',
          collection_reference_number: '2',
        });

        const container_1 = await d.saveDatum({
          __type: 'item',
          collection_id: collection_1.__id,
          item_type: 'container',
          name: 'Container #1',
          icon_name: 'box',
          icon_color: 'gray',
        });

        const container_2 = await d.saveDatum({
          __type: 'item',
          collection_id: collection_2.__id,
          item_type: 'container',
          name: 'Container #2',
          icon_name: 'box',
          icon_color: 'gray',
        });

        for (let i = 1; i <= 10; i++) {
          await d.saveDatum({
            __type: 'item',
            collection_id: collection_1.__id,
            container_id: container_1.__id,
            name: 'Item Type A',
            icon_name: 'box',
            icon_color: 'gray',
          });
        }

        for (let i = 1; i <= 9; i++) {
          await d.saveDatum({
            __type: 'item',
            collection_id: collection_1.__id,
            container_id: container_2.__id,
            name: 'Item Type B',
            icon_name: 'box',
            icon_color: 'gray',
          });
        }

        for (let i = 1; i <= 8; i++) {
          await d.saveDatum({
            __type: 'item',
            collection_id: collection_2.__id,
            container_id: container_1.__id,
            name: 'Item Type C',
            icon_name: 'box',
            icon_color: 'gray',
          });
        }

        for (let i = 1; i <= 7; i++) {
          await d.saveDatum({
            __type: 'item',
            collection_id: collection_2.__id,
            container_id: container_2.__id,
            name: 'Item Type D',
            icon_name: 'box',
            icon_color: 'gray',
          });
        }

        expect(
          await d.getDataCount('item', { collection_id: collection_1.__id }),
        ).toEqual(20); // 1 container, 10 type A, 9 type B

        expect(
          await d.getDataCount('item', { container_id: container_1.__id }),
        ).toEqual(18); // 10 type A, 8 type C

        expect(
          await d.getDataCount('item', {
            collection_id: collection_1.__id,
            container_id: container_1.__id,
          }),
        ).toEqual(10);
        expect(
          await d.getDataCount('item', {
            container_id: container_1.__id,
            collection_id: collection_1.__id,
          }),
        ).toEqual(10);

        expect(
          await d.getDataCount('item', {
            collection_id: collection_1.__id,
            container_id: container_2.__id,
          }),
        ).toEqual(9);
        expect(
          await d.getDataCount('item', {
            container_id: container_2.__id,
            collection_id: collection_1.__id,
          }),
        ).toEqual(9);

        expect(
          await d.getDataCount('item', {
            collection_id: collection_2.__id,
            container_id: container_1.__id,
          }),
        ).toEqual(8);

        expect(
          await d.getDataCount('item', {
            collection_id: collection_2.__id,
            container_id: container_2.__id,
          }),
        ).toEqual(7);
      });
    });

    it('works while there are no data', async () => {
      await withContext(async context => {
        const d = new CouchDBData(context);

        expect(await d.getDataCount('item', { collection_id: 'null' })).toEqual(
          0,
        );
        expect(
          await d.getDataCount('item', {
            collection_id: 'null',
            container_id: 'null',
          }),
        ).toEqual(0);
      });
    });
  });
});

describe('saveDatum', () => {
  it('validates the data', async () => {
    await withContext(async context => {
      const d = new CouchDBData(context);

      // Should not throw
      await d.saveDatum({
        __type: 'collection',
        name: 'Collection',
        icon_name: 'box',
        icon_color: 'gray',
        collection_reference_number: '1',
      });

      try {
        // Should throw because collection_reference_number is used
        await d.saveDatum({
          __type: 'collection',
          name: 'Collection',
          icon_name: 'box',
          icon_color: 'gray',
          collection_reference_number: '1',
        });
        throw new NoErrorThrownError();
      } catch (error) {
        if (error instanceof NoErrorThrownError) {
          throw new Error('Expects an error to be thrown, but none was thrown');
        }

        expect(error).toBeInstanceOf(ValidationError);
        expect(
          error instanceof ValidationError ? error.issues : [],
        ).toMatchSnapshot(
          'collection collection_reference_number already used',
        );
      }

      try {
        // Should throw because name is missing
        await d.saveDatum({
          __type: 'collection',
          icon_name: 'box',
          icon_color: 'gray',
          collection_reference_number: '2',
        });
        throw new NoErrorThrownError();
      } catch (error) {
        if (error instanceof NoErrorThrownError) {
          throw new Error('Expects an error to be thrown, but none was thrown');
        }

        expect(error).toBeInstanceOf(ValidationError);
        expect(
          error instanceof ValidationError ? error.issues : [],
        ).toMatchSnapshot('collection name missing');
      }

      try {
        // Should throw because name is blank
        await d.saveDatum({
          __type: 'collection',
          name: '',
          icon_name: 'box',
          icon_color: 'gray',
          collection_reference_number: '23',
        });
        throw new NoErrorThrownError();
      } catch (error) {
        if (error instanceof NoErrorThrownError) {
          throw new Error('Expects an error to be thrown, but none was thrown');
        }

        expect(error).toBeInstanceOf(ValidationError);
        expect(
          error instanceof ValidationError ? error.issues : [],
        ).toMatchSnapshot('collection name empty');
      }
    });
  });

  it('can update fields to become undefined', async () => {
    await withContext(async context => {
      const d = new CouchDBData(context);
      const collection = await d.saveDatum({
        __type: 'collection',
        name: 'Collection',
        icon_name: 'box',
        icon_color: 'gray',
        collection_reference_number: '1',
      });
      const container = await d.saveDatum({
        __type: 'item',
        collection_id: collection.__id,
        item_type: 'container',
        name: 'Container',
        icon_name: 'box',
        icon_color: 'gray',
      });
      const item = await d.saveDatum({
        __type: 'item',
        collection_id: collection.__id,
        container_id: container.__id,
        name: 'Item',
        icon_name: 'cube-outline',
        icon_color: 'gray',
        model_name: 'Model',
      });

      expect(
        (await d.getDatum('item', item.__id || ''))?.container_id,
      ).not.toBeUndefined();
      expect(
        (await d.getDatum('item', item.__id || ''))?.model_name,
      ).not.toBeUndefined();

      await d.saveDatum(
        {
          __type: 'item',
          __id: item.__id,
          container_id: undefined,
          model_name: undefined,
        },
        { ignoreConflict: true },
      );

      expect(
        (await d.getDatum('item', item.__id || ''))?.container_id,
      ).toBeUndefined();
      expect(
        (await d.getDatum('item', item.__id || ''))?.model_name,
      ).toBeUndefined();
    });
  });

  it('updates the updated timestamp', async () => {
    await withContext(async context => {
      const d = new CouchDBData(context);
      const collection = await d.saveDatum({
        __type: 'collection',
        name: 'Collection',
        icon_name: 'box',
        icon_color: 'gray',
        collection_reference_number: '1',
      });
      const item = await d.saveDatum(
        {
          __type: 'item',
          collection_id: collection.__id,
          name: 'Item',
          icon_name: 'cube-outline',
          icon_color: 'gray',
          model_name: 'Model',
          __created_at: 0,
          __updated_at: 0,
        },
        { noTouch: true },
      );

      expect((await d.getDatum('item', item.__id || ''))?.__updated_at).toEqual(
        0,
      );

      await d.saveDatum(
        {
          __type: 'item',
          __id: item.__id,
          notes: 'Hello world!',
        },
        { ignoreConflict: true },
      );

      expect(
        (await d.getDatum('item', item.__id || ''))?.__updated_at,
      ).not.toEqual(0);
    });
  });

  describe('with noTouch', () => {
    it('does not update the updated timestamp', async () => {
      await withContext(async context => {
        const d = new CouchDBData(context);
        const collection = await d.saveDatum({
          __type: 'collection',
          name: 'Collection',
          icon_name: 'box',
          icon_color: 'gray',
          collection_reference_number: '1',
        });
        const item = await d.saveDatum(
          {
            __type: 'item',
            collection_id: collection.__id,
            name: 'Item',
            icon_name: 'cube-outline',
            icon_color: 'gray',
            model_name: 'Model',
            __created_at: 0,
            __updated_at: 0,
          },
          { noTouch: true },
        );

        expect(
          (await d.getDatum('item', item.__id || ''))?.__updated_at,
        ).toEqual(0);

        await d.saveDatum(
          {
            __type: 'item',
            __id: item.__id,
            notes: 'Hello world!',
          },
          { ignoreConflict: true, noTouch: true },
        );

        expect(
          (await d.getDatum('item', item.__id || ''))?.__updated_at,
        ).toEqual(0);
      });
    });
  });

  describe('while data has no changes', () => {
    it('does not actually save the data', async () => {
      await withContext(async context => {
        const d = new CouchDBData(context);
        const collection = await d.saveDatum({
          __type: 'collection',
          name: 'Collection',
          icon_name: 'box',
          icon_color: 'gray',
          collection_reference_number: '1',
        });
        const item = await d.saveDatum(
          {
            __type: 'item',
            collection_id: collection.__id,
            name: 'Item',
            icon_name: 'cube-outline',
            icon_color: 'gray',
            model_name: 'Model',
            __created_at: 0,
            __updated_at: 0,
          },
          { noTouch: true },
        );

        expect(
          (await d.getDatum('item', item.__id || ''))?.__updated_at,
        ).toEqual(0);

        await d.saveDatum(
          {
            __type: 'item',
            __id: item.__id,
            name: 'Item',
            icon_color: 'gray',
          },
          { ignoreConflict: true },
        );

        expect(
          (await d.getDatum('item', item.__id || ''))?.__updated_at,
        ).toEqual(0);

        await d.saveDatum(
          (await d.getDatum('item', item.__id || '')) || { __type: 'item' },
          {
            ignoreConflict: true,
          },
        );
        expect(
          (await d.getDatum('item', item.__id || ''))?.__updated_at,
        ).toEqual(0);
      });
    });

    describe('with forceTouch', () => {
      it('forces save the data', async () => {
        await withContext(async context => {
          const d = new CouchDBData(context);
          const collection = await d.saveDatum({
            __type: 'collection',
            name: 'Collection',
            icon_name: 'box',
            icon_color: 'gray',
            collection_reference_number: '1',
          });
          const item = await d.saveDatum(
            {
              __type: 'item',
              collection_id: collection.__id,
              name: 'Item',
              icon_name: 'cube-outline',
              icon_color: 'gray',
              model_name: 'Model',
              __created_at: 0,
              __updated_at: 0,
            },
            { noTouch: true },
          );

          expect(
            (await d.getDatum('item', item.__id || ''))?.__updated_at,
          ).toEqual(0);

          await d.saveDatum(
            {
              __type: 'item',
              __id: item.__id,
              name: 'Item',
              icon_color: 'gray',
            },
            { ignoreConflict: true, forceTouch: true },
          );

          expect(
            (await d.getDatum('item', item.__id || ''))?.__updated_at,
          ).not.toEqual(0);
        });
      });
    });
  });
});

describe('fixDataConsistency', () => {
  it('works', async () => {
    await withContext(async context => {
      const d = new CouchDBData(context);

      const collection = await d.saveDatum({
        __type: 'collection',
        name: 'Collection',
        icon_name: 'box',
        icon_color: 'gray',
        collection_reference_number: '1',
      });

      await d.saveDatum(
        {
          __type: 'collection',
          __id: 'sample-invalid-collection-id',
          name: '',
          icon_name: 'box',
          icon_color: 'gray',
          collection_reference_number: '2',
        },
        { skipValidation: true },
      );

      for (let i = 1; i <= 10; i++) {
        await d.saveDatum({
          __type: 'item',
          collection_id: collection.__id,
          name: `Item #${i}`,
          icon_name: 'box',
          icon_color: 'gray',
        });
      }

      const itemWithReferenceNumber = await d.saveDatum(
        {
          __type: 'item',
          collection_id: collection.__id,
          name: 'Item',
          icon_name: 'cube-outline',
          icon_color: 'gray',
          item_reference_number: '123456',
        },
        { skipValidation: true, skipCallbacks: true },
      );

      expect(
        (await d.getDatum('item', itemWithReferenceNumber.__id || ''))
          ?.individual_asset_reference,
      ).toBeFalsy(); // since it's saved with skipCallbacks: true

      let fixDataConsistencyResults;
      for await (const progress of fixDataConsistency({
        batchSize: 2,
        getData: d.getData,
        getDataCount: d.getDataCount,
        saveDatum: d.saveDatum,
      })) {
        fixDataConsistencyResults = progress;
      }

      expect(
        (await d.getDatum('item', itemWithReferenceNumber.__id || ''))
          ?.individual_asset_reference,
      ).toBe('0001.123456.0000'); // Fixed by fixDataConsistency

      expect(fixDataConsistencyResults?.collection).toMatchSnapshot(
        'fixDataConsistencyResults-collection',
      );
      expect(fixDataConsistencyResults?.item).toMatchSnapshot(
        'fixDataConsistencyResults-item',
      );
    });
  });
});
