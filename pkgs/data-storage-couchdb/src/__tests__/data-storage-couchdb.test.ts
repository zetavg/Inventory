/* eslint-disable @typescript-eslint/no-var-requires */
import { fixDataConsistency } from '@invt/data/utils';
import getChildrenItems from '@invt/data/utils/getChildrenItems';
import { ValidationError } from '@invt/data/validation';
import PouchDB from 'pouchdb';

import { NYAN_CAT_PNG } from '../__fixtures__/sample-data';
import CouchDBData from '../CouchDBData';
import { getCouchDbId } from '../functions/couchdb-utils';
import { Context } from '../functions/types';

class NoErrorThrownError extends Error {}

PouchDB.plugin(require('pouchdb-find'));
const openDatabase = require('websql');
const SQLiteAdapter = require('pouchdb-adapter-react-native-sqlite/lib')({
  openDatabase,
});
PouchDB.plugin(SQLiteAdapter);

const DEBUG = process.env.DEBUG;
const COUCHDB_URI = process.env.COUCHDB_URI;
const COUCHDB_USERNAME = process.env.COUCHDB_USERNAME;
const COUCHDB_PASSWORD = process.env.COUCHDB_PASSWORD;

const contextSet = new Set();
const getContextID = () => {
  let id = 1;
  // eslint-disable-next-line no-constant-condition
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

const useRemoteDB = !!(COUCHDB_URI && COUCHDB_USERNAME && COUCHDB_PASSWORD);
if (useRemoteDB) {
  require('console').log(`Using CouchDB database: ${COUCHDB_URI}`);
}

async function withContext(fn: (c: Context) => Promise<void>) {
  const contextID = getContextID();
  const db = useRemoteDB
    ? new PouchDB(COUCHDB_URI, {
        skip_setup: true,
        auth: {
          username: COUCHDB_USERNAME,
          password: COUCHDB_PASSWORD,
        },
      })
    : new PouchDB(`.temp_dbs/pouchdb-test-${contextID}`, {
        adapter: 'react-native-sqlite',
      });

  const context: Context = {
    dbType: 'pouchdb',
    db,
    logger: DEBUG ? console : null,
    logLevels: DEBUG ? () => ['debug'] : () => [],
    alwaysCreateIndexFirst: useRemoteDB,
  };

  try {
    if (useRemoteDB) {
      await db
        .allDocs({ include_docs: true })
        .then(allDocs => {
          return allDocs.rows.map(row => {
            return { _id: row.id, _rev: row.doc?._rev, _deleted: true };
          });
        })
        .then(deleteDocs => {
          return db.bulkDocs(deleteDocs);
        });
    }

    const d = new CouchDBData(context);
    await d.updateConfig({});
    await fn(context);
  } finally {
    if (!useRemoteDB) {
      await db.destroy();
    }
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

    it('will use index with sort', async () => {
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
          { sort: [{ __created_at: 'desc' }], debug: true },
        );
        expect((collections as any).debug_info.explain.index.ddoc).toBeTruthy();

        const items = await d.getData(
          'item',
          {},
          { sort: [{ __created_at: 'asc' }], debug: true },
        );
        expect((items as any).debug_info.explain.index.ddoc).toBeTruthy();
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

        const itemsCreatedAfter0 = await d.getData('item', {
          __created_at: { $gt: 0 },
        });
        expect(
          itemsCreatedAfter0.every(it => (it.__raw as any)?.type === 'item'),
        ).toEqual(true);

        const collectionsCreatedAfter0 = await d.getData('collection', {
          __created_at: { $gt: 0 },
        });
        expect(collectionsCreatedAfter0.length).toEqual(10);
      });
    });

    it('will use index', async () => {
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

        const modelAItems = await d.getData(
          'item',
          { model_name: 'Model A' },
          { debug: true },
        );
        expect((modelAItems as any).debug_info.explain.index.ddoc).toBeTruthy();

        const modelBItems = await d.getData(
          'item',
          { model_name: 'Model B' },
          { debug: true },
        );
        expect((modelBItems as any).debug_info.explain.index.ddoc).toBeTruthy();

        const itemsCreatedAfter0 = await d.getData(
          'item',
          {
            __created_at: { $gt: 0 },
          },
          { debug: true },
        );
        expect(
          (itemsCreatedAfter0 as any).debug_info.explain.index.ddoc,
        ).toBeTruthy();

        const collectionsCreatedAfter0 = await d.getData(
          'collection',
          {
            __created_at: { $gt: 0 },
          },
          { debug: true },
        );
        expect(
          (collectionsCreatedAfter0 as any).debug_info.explain.index.ddoc,
        ).toBeTruthy();
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
          {
            sort: [
              // { model_name: 'desc' }, // To prevent CouchDB error - { "error": "unsupported_mixed_sort", "reason": "Sorts currently only support a single direction for all fields.", "status": 400 } // This is now handled in getData
              { purchase_price_x1000: 'desc' },
            ],
          },
        );
        expect(items_b).toHaveLength(5);
        expect(items_b.map(it => it.name)).toEqual(
          Array.from(new Array(5))
            .map((_, i) => `Item #${i + 6}`)
            .reverse(),
        );
      });
    });

    it('will use index with sort', async () => {
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
          { sort: [{ purchase_price_x1000: 'asc' }], debug: true },
        );
        expect((items_a as any).debug_info.explain.index.ddoc).toBeTruthy();

        const items_b = await d.getData(
          'item',
          { model_name: 'Model B' },
          {
            sort: [
              // { model_name: 'desc' }, // To prevent CouchDB error - { "error": "unsupported_mixed_sort", "reason": "Sorts currently only support a single direction for all fields.", "status": 400 } // This is now handled in getData
              { purchase_price_x1000: 'desc' },
            ],
            debug: true,
          },
        );
        expect((items_b as any).debug_info.explain.index.ddoc).toBeTruthy();
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
  it('returns the data with new __rev', async () => {
    await withContext(async context => {
      const d = new CouchDBData(context);

      const d1 = await d.saveDatum({
        __type: 'collection',
        name: 'Collection',
        icon_name: 'box',
        icon_color: 'gray',
        collection_reference_number: '1',
      });

      expect(d1.__rev).toBeTruthy();

      const d2 = await d.saveDatum(d1);
      expect(d2.__rev).toEqual(d1.__rev); // Nothing changes

      const d3 = await d.saveDatum({
        ...d2,
        name: 'Collection Updated',
      });
      expect(d3.__rev).not.toEqual(d2.__rev);
    });
  });

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

  it('validates attachments', async () => {
    await withContext(async context => {
      const d = new CouchDBData(context);

      const image = {
        __type: 'image',
        __id: '1',
      } as const;

      // Missing all attachments
      await expect(async () => {
        await d.saveDatum(image);
      }).rejects.toThrowError();

      await d.attachAttachmentToDatum(
        image,
        'thumbnail-128',
        NYAN_CAT_PNG.content_type,
        NYAN_CAT_PNG.data,
      );

      // Missing one attachment
      await expect(async () => {
        await d.saveDatum(image);
      }).rejects.toThrowError();

      await d.attachAttachmentToDatum(
        image,
        'image-1440',
        'unknown' as any,
        NYAN_CAT_PNG.data,
      );

      // Invalid content type
      await expect(async () => {
        await d.saveDatum(image);
      }).rejects.toThrowError();

      await d.attachAttachmentToDatum(
        image,
        'image-1440',
        NYAN_CAT_PNG.content_type,
        NYAN_CAT_PNG.data,
      );

      // Success
      await d.saveDatum(image);
    });
  });

  it('works for image', async () => {
    await withContext(async context => {
      const d = new CouchDBData(context);

      const image = {
        __type: 'image',
        __id: '1',
      } as const;

      await d.attachAttachmentToDatum(
        image,
        'thumbnail-128',
        NYAN_CAT_PNG.content_type,
        NYAN_CAT_PNG.data,
      );
      await d.attachAttachmentToDatum(
        image,
        'image-1440',
        NYAN_CAT_PNG.content_type,
        NYAN_CAT_PNG.data,
      );

      await d.saveDatum(image);

      const loadedImage = await d.getDatum(image.__type, image.__id);
      if (!loadedImage) throw new Error('loadedImage is null');

      expect(loadedImage.size).toBe(271 * 2);
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

  it('preserves additional fields', async () => {
    await withContext(async context => {
      const d = new CouchDBData(context);
      const collection = await d.saveDatum({
        __type: 'collection',
        __id: '1',
        name: 'Collection',
        icon_name: 'box',
        icon_color: 'gray',
        collection_reference_number: '1',
      });
      const doc = await (context.db as any).get('collection-1');

      await (context.db as any).put({
        ...doc,
        additional_field: 'hello',
      });

      expect(
        (await (context.db as any).get('collection-1')).additional_field,
      ).toEqual('hello');

      await d.saveDatum(
        {
          ...collection,
          name: 'Collection 1',
        },
        { ignoreConflict: true },
      );

      expect((await (context.db as any).get('collection-1')).data.name).toEqual(
        'Collection 1',
      );
      expect(
        (await (context.db as any).get('collection-1')).additional_field,
      ).toEqual('hello');

      await d.saveDatum({
        ...(await d.getDatum('collection', '1')),
        name: 'Collection 2',
      } as any);

      expect((await (context.db as any).get('collection-1')).data.name).toEqual(
        'Collection 2',
      );
      expect(
        (await (context.db as any).get('collection-1')).additional_field,
      ).toEqual('hello');

      await d.saveDatum([
        'collection',
        '1',
        c => ({ ...c, name: c.name + ' Updated' }),
      ]);

      expect((await (context.db as any).get('collection-1')).data.name).toEqual(
        'Collection 2 Updated',
      );
      expect(
        (await (context.db as any).get('collection-1')).additional_field,
      ).toEqual('hello');
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

  describe('with updater function', () => {
    it('updates the datum', async () => {
      await withContext(async context => {
        const d = new CouchDBData(context);

        const collection = await d.saveDatum({
          __type: 'collection',
          name: 'Collection',
          icon_name: 'box',
          icon_color: 'gray',
          collection_reference_number: '1',
        });

        const consumableItem = await d.saveDatum({
          __type: 'item',
          collection_id: collection.__id,
          name: 'Consumable Item',
          icon_name: 'cube-outline',
          icon_color: 'gray',
          item_type: 'consumable',
          consumable_stock_quantity: 1,
        });

        await d.saveDatum([
          'item',
          consumableItem.__id || '',
          datum => ({
            consumable_stock_quantity:
              (typeof datum.consumable_stock_quantity === 'number' &&
              !isNaN(datum.consumable_stock_quantity)
                ? datum.consumable_stock_quantity
                : 0) + 1,
          }),
        ]);

        expect(
          (await d.getDatum('item', consumableItem.__id || ''))
            ?.consumable_stock_quantity,
        ).toBe(2);

        await d.saveDatum([
          'item',
          consumableItem.__id || '',
          datum => ({
            consumable_stock_quantity:
              (typeof datum.consumable_stock_quantity === 'number' &&
              !isNaN(datum.consumable_stock_quantity)
                ? datum.consumable_stock_quantity
                : 0) + 1,
          }),
        ]);

        expect(
          (await d.getDatum('item', consumableItem.__id || ''))
            ?.consumable_stock_quantity,
        ).toBe(3);
      });
    });

    // it('updates the datum while the updater function directly assigns new value to the datum', async () => {
    //   await withContext(async context => {
    //     const d = new CouchDBData(context);

    //     const collection = await d.saveDatum({
    //       __type: 'collection',
    //       name: 'Collection',
    //       icon_name: 'box',
    //       icon_color: 'gray',
    //       collection_reference_number: '1',
    //     });

    //     const item = await d.saveDatum({
    //       __type: 'item',
    //       collection_id: collection.__id,
    //       name: 'Item',
    //       icon_name: 'cube-outline',
    //       icon_color: 'gray',
    //     });

    //     await d.saveDatum([
    //       'item',
    //       item.__id || '',
    //       datum => {
    //         datum.name = 'Updated Item';
    //         return datum;
    //       },
    //     ]);

    //     expect((await d.getDatum('item', item.__id || ''))?.name).toBe(
    //       'Updated Item',
    //     );
    //   });
    // });

    it('returns the saved datum', async () => {
      await withContext(async context => {
        const d = new CouchDBData(context);

        const collection = await d.saveDatum({
          __type: 'collection',
          name: 'Collection',
          icon_name: 'box',
          icon_color: 'gray',
          collection_reference_number: '1',
        });

        const consumableItem = await d.saveDatum({
          __type: 'item',
          collection_id: collection.__id,
          name: 'Consumable Item',
          icon_name: 'cube-outline',
          icon_color: 'gray',
          item_type: 'consumable',
          consumable_stock_quantity: 1,
        });

        const updatedConsumableItem = await d.saveDatum([
          'item',
          consumableItem.__id || '',
          datum => ({
            consumable_stock_quantity:
              (typeof datum.consumable_stock_quantity === 'number' &&
              !isNaN(datum.consumable_stock_quantity)
                ? datum.consumable_stock_quantity
                : 0) + 1,
          }),
        ]);

        expect(updatedConsumableItem?.consumable_stock_quantity).toBe(2);
      });
    });

    it('does data validation and callbacks', async () => {
      await withContext(async context => {
        const d = new CouchDBData(context);

        const collection = await d.saveDatum({
          __type: 'collection',
          name: 'Collection',
          icon_name: 'box',
          icon_color: 'gray',
          collection_reference_number: '1',
        });

        const consumableItem = await d.saveDatum({
          __type: 'item',
          collection_id: collection.__id,
          name: 'Consumable Item',
          icon_name: 'cube-outline',
          icon_color: 'gray',
          item_type: 'consumable',
          consumable_stock_quantity: 1,
        });

        await d.saveDatum([
          'item',
          consumableItem.__id || '',
          datum => ({
            consumable_stock_quantity:
              (typeof datum.consumable_stock_quantity === 'number' &&
              !isNaN(datum.consumable_stock_quantity)
                ? datum.consumable_stock_quantity
                : 0) + 1,
            item_reference_number: '000001',
          }),
        ]);

        const updatedDatum1 = await d.getDatum(
          'item',
          consumableItem.__id || '',
        );
        expect(updatedDatum1?.consumable_stock_quantity).toBe(2);
        expect(updatedDatum1?.individual_asset_reference).toBe(
          '0001.000001.0000',
        );

        await expect(async () => {
          await d.saveDatum([
            'item',
            consumableItem.__id || '',
            () => ({
              consumable_stock_quantity: 'invalid!' as any,
              item_reference_number: '000001',
            }),
          ]);
        }).rejects.toThrowError(ValidationError);

        const updatedDatum2 = await d.getDatum(
          'item',
          consumableItem.__id || '',
        );
        expect(updatedDatum2?.consumable_stock_quantity).toBe(2);
        expect(updatedDatum2?.individual_asset_reference).toBe(
          '0001.000001.0000',
        );
      });
    });

    it('can skip data validation and callbacks', async () => {
      await withContext(async context => {
        const d = new CouchDBData(context);

        const collection = await d.saveDatum({
          __type: 'collection',
          name: 'Collection',
          icon_name: 'box',
          icon_color: 'gray',
          collection_reference_number: '0001',
        });

        const consumableItem = await d.saveDatum({
          __type: 'item',
          collection_id: collection.__id,
          name: 'Consumable Item',
          icon_name: 'cube-outline',
          icon_color: 'gray',
          item_type: 'consumable',
          consumable_stock_quantity: 1,
        });

        await d.saveDatum([
          'item',
          consumableItem.__id || '',
          datum => ({
            consumable_stock_quantity:
              (typeof datum.consumable_stock_quantity === 'number' &&
              !isNaN(datum.consumable_stock_quantity)
                ? datum.consumable_stock_quantity
                : 0) + 1,
            item_reference_number: '000001',
          }),
        ]);

        const updatedDatum1 = await d.getDatum(
          'item',
          consumableItem.__id || '',
        );
        expect(updatedDatum1?.consumable_stock_quantity).toBe(2);
        expect(updatedDatum1?.individual_asset_reference).toBe(
          '0001.000001.0000',
        );

        await d.saveDatum(
          [
            'item',
            consumableItem.__id || '',
            () => ({
              consumable_stock_quantity: 'invalid!' as any,
              item_reference_number: '000002',
            }),
          ],
          { skipValidation: true, skipCallbacks: true },
        );

        const updatedDatum2 = await d.getDatum(
          'item',
          consumableItem.__id || '',
        );
        expect(updatedDatum2?.consumable_stock_quantity).toBe('invalid!');
        expect(updatedDatum2?.individual_asset_reference).toBe(
          '0001.000001.0000',
        );
      });
    });

    it('prevents race conditions', async () => {
      await withContext(async context => {
        const d = new CouchDBData(context);

        const collection = await d.saveDatum({
          __type: 'collection',
          name: 'Collection',
          icon_name: 'box',
          icon_color: 'gray',
          collection_reference_number: '1',
        });

        const consumableItem = await d.saveDatum({
          __type: 'item',
          collection_id: collection.__id,
          name: 'Consumable Item',
          icon_name: 'cube-outline',
          icon_color: 'gray',
          item_type: 'consumable',
          consumable_stock_quantity: 1,
        });

        const toAdd = 20;

        await Promise.all(
          Array.from(new Array(toAdd)).map(async () => {
            await d.saveDatum([
              'item',
              consumableItem.__id || '',
              datum => ({
                consumable_stock_quantity:
                  (typeof datum.consumable_stock_quantity === 'number' &&
                  !isNaN(datum.consumable_stock_quantity)
                    ? datum.consumable_stock_quantity
                    : 0) + 1,
              }),
            ]);
          }),
        );

        const updatedDatum = await d.getDatum(
          'item',
          consumableItem.__id || '',
        );
        expect(updatedDatum?.consumable_stock_quantity).toBe(1 + toAdd);
      });
    });
  });

  describe('for items', () => {
    it('adding item_image will update info on item_image and image', async () => {
      await withContext(async context => {
        const d = new CouchDBData(context);

        const imageD = {
          __type: 'image',
          __id: '1',
        } as const;

        await d.attachAttachmentToDatum(
          imageD,
          'thumbnail-128',
          NYAN_CAT_PNG.content_type,
          NYAN_CAT_PNG.data,
        );
        await d.attachAttachmentToDatum(
          imageD,
          'image-1440',
          NYAN_CAT_PNG.content_type,
          NYAN_CAT_PNG.data,
        );

        const image = await d.saveDatum(imageD);

        const collection_1 = await d.saveDatum({
          __type: 'collection',
          __id: 'c-1',
          name: 'Collection 1',
          icon_name: 'box',
          icon_color: 'gray',
          collection_reference_number: '1',
        });

        const item_1 = await d.saveDatum({
          __type: 'item',
          __id: 'i-1',
          collection_id: collection_1.__id,
          name: 'Item 1',
          icon_name: 'box',
          icon_color: 'gray',
        });

        const item_image_1 = await d.saveDatum({
          __type: 'item_image',
          item_id: item_1.__id,
          image_id: image.__id,
        });

        expect(item_image_1._item_collection_id).toEqual(collection_1.__id);

        const loadedImage1 = await d.getDatum('image', image.__id || '');
        expect((loadedImage1?._item_ids as any).sort()).toEqual(
          [item_1.__id].sort(),
        );
        expect((loadedImage1?._item_collection_ids as any).sort()).toEqual(
          [collection_1.__id].sort(),
        );

        const item_2 = await d.saveDatum({
          __type: 'item',
          __id: 'i-2',
          collection_id: collection_1.__id,
          name: 'Item 2',
          icon_name: 'box',
          icon_color: 'gray',
        });

        const item_image_2 = await d.saveDatum({
          __type: 'item_image',
          item_id: item_2.__id,
          image_id: image.__id,
        });

        expect(item_image_2._item_collection_id).toEqual(collection_1.__id);

        const loadedImage2 = await d.getDatum('image', image.__id || '');
        expect((loadedImage2?._item_ids as any).sort()).toEqual(
          [item_1.__id, item_2.__id].sort(),
        );
        expect((loadedImage2?._item_collection_ids as any).sort()).toEqual(
          [collection_1.__id].sort(),
        );
      });
    });

    it('updating item will update info on item_image and image', async () => {
      await withContext(async context => {
        const d = new CouchDBData(context);

        const imageD = {
          __type: 'image',
          __id: '1',
        } as const;

        await d.attachAttachmentToDatum(
          imageD,
          'thumbnail-128',
          NYAN_CAT_PNG.content_type,
          NYAN_CAT_PNG.data,
        );
        await d.attachAttachmentToDatum(
          imageD,
          'image-1440',
          NYAN_CAT_PNG.content_type,
          NYAN_CAT_PNG.data,
        );

        const image = await d.saveDatum(imageD);

        const collection_1 = await d.saveDatum({
          __type: 'collection',
          __id: 'c-1',
          name: 'Collection 1',
          icon_name: 'box',
          icon_color: 'gray',
          collection_reference_number: '1',
        });

        const collection_2 = await d.saveDatum({
          __type: 'collection',
          __id: 'c-2',
          name: 'Collection 2',
          icon_name: 'box',
          icon_color: 'gray',
          collection_reference_number: '2',
        });

        const item_1 = await d.saveDatum({
          __type: 'item',
          __id: 'i-1',
          collection_id: collection_1.__id,
          name: 'Item 1',
          icon_name: 'box',
          icon_color: 'gray',
        });

        const item_image_1 = await d.saveDatum({
          __type: 'item_image',
          item_id: item_1.__id,
          image_id: image.__id,
        });

        const item_2 = await d.saveDatum({
          __type: 'item',
          __id: 'i-2',
          collection_id: collection_1.__id,
          name: 'Item 2',
          icon_name: 'box',
          icon_color: 'gray',
        });

        const item_image_2 = await d.saveDatum({
          __type: 'item_image',
          item_id: item_2.__id,
          image_id: image.__id,
        });

        expect(
          (await d.getDatum(item_image_1.__type, item_image_1.__id || ''))
            ?._item_collection_id,
        ).toEqual(collection_1.__id);
        expect(
          (await d.getDatum(item_image_2.__type, item_image_2.__id || ''))
            ?._item_collection_id,
        ).toEqual(collection_1.__id);
        expect(
          (
            (await d.getDatum(image.__type, image.__id || ''))?._item_ids as any
          ).sort(),
        ).toEqual([item_1.__id, item_2.__id].sort());
        expect(
          (
            (await d.getDatum(image.__type, image.__id || ''))
              ?._item_collection_ids as any
          ).sort(),
        ).toEqual([collection_1.__id].sort());

        await d.saveDatum({
          ...item_1,
          collection_id: collection_2.__id,
        });

        expect(
          (await d.getDatum(item_image_1.__type, item_image_1.__id || ''))
            ?._item_collection_id,
        ).toEqual(collection_2.__id);
        expect(
          (await d.getDatum(item_image_2.__type, item_image_2.__id || ''))
            ?._item_collection_id,
        ).toEqual(collection_1.__id);
        expect(
          (
            (await d.getDatum(image.__type, image.__id || ''))?._item_ids as any
          ).sort(),
        ).toEqual([item_1.__id, item_2.__id].sort());
        expect(
          (
            (await d.getDatum(image.__type, image.__id || ''))
              ?._item_collection_ids as any
          ).sort(),
        ).toEqual([collection_1.__id, collection_2.__id].sort());

        await d.saveDatum({
          ...item_2,
          collection_id: collection_2.__id,
        });

        expect(
          (await d.getDatum(item_image_1.__type, item_image_1.__id || ''))
            ?._item_collection_id,
        ).toEqual(collection_2.__id);
        expect(
          (await d.getDatum(item_image_2.__type, item_image_2.__id || ''))
            ?._item_collection_id,
        ).toEqual(collection_2.__id);
        expect(
          (
            (await d.getDatum(image.__type, image.__id || ''))?._item_ids as any
          ).sort(),
        ).toEqual([item_1.__id, item_2.__id].sort());
        expect(
          (
            (await d.getDatum(image.__type, image.__id || ''))
              ?._item_collection_ids as any
          ).sort(),
        ).toEqual([collection_2.__id].sort());
      });
    });

    it('deleting item_image will update info on image', async () => {
      await withContext(async context => {
        const d = new CouchDBData(context);

        const imageD = {
          __type: 'image',
          __id: '1',
        } as const;

        await d.attachAttachmentToDatum(
          imageD,
          'thumbnail-128',
          NYAN_CAT_PNG.content_type,
          NYAN_CAT_PNG.data,
        );
        await d.attachAttachmentToDatum(
          imageD,
          'image-1440',
          NYAN_CAT_PNG.content_type,
          NYAN_CAT_PNG.data,
        );

        const image = await d.saveDatum(imageD);

        const collection_1 = await d.saveDatum({
          __type: 'collection',
          __id: 'c-1',
          name: 'Collection 1',
          icon_name: 'box',
          icon_color: 'gray',
          collection_reference_number: '1',
        });

        const collection_2 = await d.saveDatum({
          __type: 'collection',
          __id: 'c-2',
          name: 'Collection 2',
          icon_name: 'box',
          icon_color: 'gray',
          collection_reference_number: '2',
        });

        const item_1 = await d.saveDatum({
          __type: 'item',
          __id: 'i-1',
          collection_id: collection_1.__id,
          name: 'Item 1',
          icon_name: 'box',
          icon_color: 'gray',
        });

        const item_image_1 = await d.saveDatum({
          __type: 'item_image',
          item_id: item_1.__id,
          image_id: image.__id,
        });

        const item_2 = await d.saveDatum({
          __type: 'item',
          __id: 'i-2',
          collection_id: collection_2.__id,
          name: 'Item 2',
          icon_name: 'box',
          icon_color: 'gray',
        });

        const item_image_2 = await d.saveDatum({
          __type: 'item_image',
          item_id: item_2.__id,
          image_id: image.__id,
        });

        expect(
          (await d.getDatum(item_image_1.__type, item_image_1.__id || ''))
            ?._item_collection_id,
        ).toEqual(collection_1.__id);
        expect(
          (await d.getDatum(item_image_2.__type, item_image_2.__id || ''))
            ?._item_collection_id,
        ).toEqual(collection_2.__id);
        expect(
          (
            (await d.getDatum(image.__type, image.__id || ''))?._item_ids as any
          ).sort(),
        ).toEqual([item_1.__id, item_2.__id].sort());
        expect(
          (
            (await d.getDatum(image.__type, image.__id || ''))
              ?._item_collection_ids as any
          ).sort(),
        ).toEqual([collection_1.__id, collection_2.__id].sort());

        await d.saveDatum(
          {
            __type: item_image_1.__type,
            __id: item_image_1.__id,
            __deleted: true,
          },
          { ignoreConflict: true },
        );

        expect(
          (
            (await d.getDatum(image.__type, image.__id || ''))?._item_ids as any
          ).sort(),
        ).toEqual([item_2.__id].sort());
        expect(
          (
            (await d.getDatum(image.__type, image.__id || ''))
              ?._item_collection_ids as any
          ).sort(),
        ).toEqual([collection_2.__id].sort());

        await d.saveDatum(
          {
            __type: item_image_2.__type,
            __id: item_image_2.__id,
            __deleted: true,
          },
          { ignoreConflict: true },
        );

        expect(
          (
            (await d.getDatum(image.__type, image.__id || ''))?._item_ids as any
          ).sort(),
        ).toEqual([].sort());
        expect(
          (
            (await d.getDatum(image.__type, image.__id || ''))
              ?._item_collection_ids as any
          ).sort(),
        ).toEqual([].sort());
      });
    });

    it('deleting item will update info on item_image and image', async () => {
      await withContext(async context => {
        const d = new CouchDBData(context);

        const imageD = {
          __type: 'image',
          __id: '1',
        } as const;

        await d.attachAttachmentToDatum(
          imageD,
          'thumbnail-128',
          NYAN_CAT_PNG.content_type,
          NYAN_CAT_PNG.data,
        );
        await d.attachAttachmentToDatum(
          imageD,
          'image-1440',
          NYAN_CAT_PNG.content_type,
          NYAN_CAT_PNG.data,
        );

        const image = await d.saveDatum(imageD);

        const collection_1 = await d.saveDatum({
          __type: 'collection',
          __id: 'c-1',
          name: 'Collection 1',
          icon_name: 'box',
          icon_color: 'gray',
          collection_reference_number: '1',
        });

        const collection_2 = await d.saveDatum({
          __type: 'collection',
          __id: 'c-2',
          name: 'Collection 2',
          icon_name: 'box',
          icon_color: 'gray',
          collection_reference_number: '2',
        });

        const item_1 = await d.saveDatum({
          __type: 'item',
          __id: 'i-1',
          collection_id: collection_1.__id,
          name: 'Item 1',
          icon_name: 'box',
          icon_color: 'gray',
        });

        const item_image_1 = await d.saveDatum({
          __type: 'item_image',
          item_id: item_1.__id,
          image_id: image.__id,
        });

        const item_2 = await d.saveDatum({
          __type: 'item',
          __id: 'i-2',
          collection_id: collection_2.__id,
          name: 'Item 2',
          icon_name: 'box',
          icon_color: 'gray',
        });

        const item_image_2 = await d.saveDatum({
          __type: 'item_image',
          item_id: item_2.__id,
          image_id: image.__id,
        });

        expect(
          (await d.getDatum(item_image_1.__type, item_image_1.__id || ''))
            ?._item_collection_id,
        ).toEqual(collection_1.__id);
        expect(
          (await d.getDatum(item_image_2.__type, item_image_2.__id || ''))
            ?._item_collection_id,
        ).toEqual(collection_2.__id);
        expect(
          (
            (await d.getDatum(image.__type, image.__id || ''))?._item_ids as any
          ).sort(),
        ).toEqual([item_1.__id, item_2.__id].sort());
        expect(
          (
            (await d.getDatum(image.__type, image.__id || ''))
              ?._item_collection_ids as any
          ).sort(),
        ).toEqual([collection_1.__id, collection_2.__id].sort());

        await d.saveDatum(
          {
            __type: item_1.__type,
            __id: item_1.__id,
            __deleted: true,
          },
          { ignoreConflict: true },
        );

        expect(
          await d.getDatum(item_image_1.__type, item_image_1.__id || ''),
        ).toBe(null);
        expect(
          (
            (await d.getDatum(image.__type, image.__id || ''))?._item_ids as any
          ).sort(),
        ).toEqual([item_2.__id].sort());
        expect(
          (
            (await d.getDatum(image.__type, image.__id || ''))
              ?._item_collection_ids as any
          ).sort(),
        ).toEqual([collection_2.__id].sort());

        await d.saveDatum(
          {
            __type: item_2.__type,
            __id: item_2.__id,
            __deleted: true,
          },
          { ignoreConflict: true },
        );

        expect(
          await d.getDatum(item_image_2.__type, item_image_2.__id || ''),
        ).toBe(null);
        expect(
          (
            (await d.getDatum(image.__type, image.__id || ''))?._item_ids as any
          ).sort(),
        ).toEqual([].sort());
        expect(
          (
            (await d.getDatum(image.__type, image.__id || ''))
              ?._item_collection_ids as any
          ).sort(),
        ).toEqual([].sort());
      });
    });
  });
});

describe('attachAttachmentToDatum', () => {
  it('attach an attachment that can be saved with saveDatum', async () => {
    await withContext(async context => {
      const d = new CouchDBData(context);

      // Attach to object from getDatum
      await d.saveDatum(
        { __type: 'image', __id: '1' },
        { skipValidation: true },
      );
      const image_1 = await d.getDatum('image', '1');
      if (!image_1) throw new Error('image_1 is null');

      await d.attachAttachmentToDatum(
        image_1,
        'thumbnail-128',
        NYAN_CAT_PNG.content_type,
        NYAN_CAT_PNG.data,
      );
      await d.saveDatum(image_1, { skipValidation: true });

      const image_1_doc = await (context.db as any).get(
        getCouchDbId(image_1.__type, image_1.__id || ''),
      );

      expect(image_1_doc._attachments['thumbnail-128'].content_type).toBe(
        'image/png',
      );
      expect(image_1_doc._attachments['thumbnail-128'].length).toBe(271);

      // Attach to object literal
      const image_2 = { __type: 'image', __id: '2' } as const;
      d.attachAttachmentToDatum(
        image_2,
        'thumbnail-128',
        NYAN_CAT_PNG.content_type,
        NYAN_CAT_PNG.data,
      );
      await d.saveDatum(image_2, { skipValidation: true });

      const image_2_doc = await (context.db as any).get(
        getCouchDbId(image_2.__type, image_2.__id || ''),
      );

      expect(image_2_doc._attachments['thumbnail-128'].content_type).toBe(
        'image/png',
      );
      expect(image_2_doc._attachments['thumbnail-128'].length).toBe(271);
    });
  });
});

describe('getAllAttachmentInfoFromDatum', () => {
  it('works', async () => {
    await withContext(async context => {
      const d = new CouchDBData(context);

      const image = {
        __type: 'image',
        __id: '1',
      } as const;

      await d.attachAttachmentToDatum(
        image,
        'thumbnail-128',
        NYAN_CAT_PNG.content_type,
        NYAN_CAT_PNG.data,
      );
      await d.attachAttachmentToDatum(
        image,
        'image-1440',
        NYAN_CAT_PNG.content_type,
        NYAN_CAT_PNG.data,
      );

      await d.saveDatum(image);

      const loadedImage = await d.getDatum(image.__type, image.__id);
      if (!loadedImage) throw new Error('loadedImage is null');

      const allAttachmentInfo =
        await d.getAllAttachmentInfoFromDatum(loadedImage);

      expect(allAttachmentInfo).toMatchSnapshot();
    });
  });
});

describe('getAttachmentFromDatum', () => {
  it('works', async () => {
    await withContext(async context => {
      const d = new CouchDBData(context);

      const image = {
        __type: 'image',
        __id: '1',
      } as const;

      await d.attachAttachmentToDatum(
        image,
        'thumbnail-128',
        NYAN_CAT_PNG.content_type,
        NYAN_CAT_PNG.data,
      );
      await d.attachAttachmentToDatum(
        image,
        'image-1440',
        NYAN_CAT_PNG.content_type,
        NYAN_CAT_PNG.data,
      );

      await d.saveDatum(image);

      const loadedImage = await d.getDatum(image.__type, image.__id);
      if (!loadedImage) throw new Error('loadedImage is null');

      const attachment = await d.getAttachmentFromDatum(
        loadedImage,
        'thumbnail-128',
      );

      expect(attachment?.content_type).toBe('image/png');
      expect(attachment?.size).toBe(271);
      expect(attachment?.data).toBeTruthy();
    });
  });
});

describe('data-histories', () => {
  describe('saveDatum with createHistory', () => {
    it('creates histories when creating data', async () => {
      await withContext(async context => {
        const d = new CouchDBData(context);

        await d.saveDatum(
          {
            __type: 'collection',
            __id: '1',
            name: 'Collection',
            collection_reference_number: '0001',
          },
          { createHistory: {} },
        );

        expect(await d.getDatumHistories('collection', '1')).toMatchObject([
          {
            data_type: 'collection',
            data_id: '1',
            original_data: {
              __deleted: true,
            },
            new_data: {
              name: 'Collection',
              collection_reference_number: '0001',
            },
          },
        ]);
      });
    });

    it('creates histories when updating data', async () => {
      await withContext(async context => {
        const d = new CouchDBData(context);

        await d.saveDatum(
          {
            __type: 'collection',
            __id: '1',
            name: 'Collection',
            collection_reference_number: '0001',
          },
          { createHistory: {} },
        );

        await d.saveDatum(
          {
            __type: 'collection',
            __id: '1',
            name: 'Collection Updated',
            collection_reference_number: '0002',
          },
          { createHistory: {}, ignoreConflict: true },
        );

        expect(await d.getDatumHistories('collection', '1')).toMatchObject([
          {
            data_type: 'collection',
            data_id: '1',
            original_data: {
              name: 'Collection',
              collection_reference_number: '0001',
            },
            new_data: {
              name: 'Collection Updated',
              collection_reference_number: '0002',
            },
          },
          {
            data_type: 'collection',
            data_id: '1',
            original_data: {
              __deleted: true,
            },
            new_data: {
              name: 'Collection',
              collection_reference_number: '0001',
            },
          },
        ]);
      });
    });

    it('creates histories when deleting data', async () => {
      await withContext(async context => {
        const d = new CouchDBData(context);

        await d.saveDatum(
          {
            __type: 'collection',
            __id: '1',
            name: 'Collection',
            collection_reference_number: '0001',
          },
          { createHistory: {} },
        );

        await d.saveDatum(
          {
            __type: 'collection',
            __id: '1',
            __deleted: true,
          },
          { createHistory: {}, ignoreConflict: true },
        );

        expect(await d.getDatumHistories('collection', '1')).toMatchObject([
          {
            data_type: 'collection',
            data_id: '1',
            original_data: {
              name: 'Collection',
              collection_reference_number: '0001',
            },
            new_data: {
              __deleted: true,
            },
          },
          {
            data_type: 'collection',
            data_id: '1',
            original_data: {
              __deleted: true,
            },
            new_data: {
              name: 'Collection',
              collection_reference_number: '0001',
            },
          },
        ]);
      });
    });

    it('does not create history when updated data is unchanged', async () => {
      await withContext(async context => {
        const d = new CouchDBData(context);

        await d.saveDatum(
          {
            __type: 'collection',
            __id: '1',
            name: 'Collection',
            collection_reference_number: '0001',
          },
          { createHistory: {} },
        );

        await d.saveDatum(
          {
            __type: 'collection',
            __id: '1',
            name: 'Collection',
            collection_reference_number: '0001',
          },
          { createHistory: {} },
        );

        expect(await d.getDatumHistories('collection', '1')).toMatchObject([
          {
            data_type: 'collection',
            data_id: '1',
            original_data: {
              __deleted: true,
            },
            new_data: {
              name: 'Collection',
              collection_reference_number: '0001',
            },
          },
        ]);
      });
    });

    it('does not create history when updated data only has metadata changes', async () => {
      await withContext(async context => {
        const d = new CouchDBData(context);

        await d.saveDatum(
          {
            __type: 'collection',
            __id: '1',
            name: 'Collection',
            collection_reference_number: '0001',
          },
          { createHistory: {} },
        );

        await d.saveDatum(
          {
            __type: 'collection',
            __id: '1',
            name: 'Collection',
            collection_reference_number: '0001',
            // metadata
            integrations: {
              'a-integration': {
                foo: 'bar',
              },
            },
          },
          { createHistory: {} },
        );

        expect(await d.getDatumHistories('collection', '1')).toMatchObject([
          {
            data_type: 'collection',
            data_id: '1',
            original_data: {
              __deleted: true,
            },
            new_data: {
              name: 'Collection',
              collection_reference_number: '0001',
            },
          },
        ]);
      });
    });

    it('created history will not include metadata changes in normal cases', async () => {
      await withContext(async context => {
        const d = new CouchDBData(context);

        await d.saveDatum(
          {
            __type: 'collection',
            __id: '1',
            name: 'Collection',
            collection_reference_number: '0001',
            // metadata
            integrations: {
              'a-integration': {
                foo: 'bar',
              },
            },
          },
          { createHistory: {} },
        );

        await d.saveDatum(
          {
            __type: 'collection',
            __id: '1',
            name: 'Collection Updated',
            collection_reference_number: '0002',
            // metadata
            integrations: {
              'a-integration': {
                foo: 'bar',
              },
              'b-integration': {
                foo: 'bar',
              },
            },
          },
          { createHistory: {} },
        );

        const histories = await d.getDatumHistories('collection', '1');
        expect(histories).toMatchObject([
          {
            data_type: 'collection',
            data_id: '1',
            original_data: {
              name: 'Collection',
              collection_reference_number: '0001',
            },
            new_data: {
              name: 'Collection Updated',
              collection_reference_number: '0002',
            },
          },
          {
            data_type: 'collection',
            data_id: '1',
            original_data: {
              __deleted: true,
            },
            new_data: {
              name: 'Collection',
              collection_reference_number: '0001',
            },
          },
        ]);

        expect(histories[0].original_data).not.toHaveProperty('integrations');
        expect(histories[0].new_data).not.toHaveProperty('integrations');
        expect(histories[1].original_data).not.toHaveProperty('integrations');
        expect(histories[1].new_data).not.toHaveProperty('integrations');
      });
    });

    it('histories created on deletion will include metadata', async () => {
      await withContext(async context => {
        const d = new CouchDBData(context);

        await d.saveDatum(
          {
            __type: 'collection',
            __id: '1',
            name: 'Collection',
            collection_reference_number: '0001',
            // metadata
            integrations: {
              'a-integration': {
                foo: 'bar',
              },
            },
          },
          { createHistory: {} },
        );

        await d.saveDatum(
          {
            __type: 'collection',
            __id: '1',
            __deleted: true,
          },
          { createHistory: {}, ignoreConflict: true },
        );

        expect(await d.getDatumHistories('collection', '1')).toMatchObject([
          {
            data_type: 'collection',
            data_id: '1',
            original_data: {
              name: 'Collection',
              collection_reference_number: '0001',
              integrations: {
                'a-integration': {
                  foo: 'bar',
                },
              },
            },
            new_data: {
              __deleted: true,
            },
          },
          {
            data_type: 'collection',
            data_id: '1',
            original_data: {
              __deleted: true,
            },
            new_data: {
              name: 'Collection',
              collection_reference_number: '0001',
            },
          },
        ]);
      });
    });

    it('creates histories that includes info', async () => {
      await withContext(async context => {
        const d = new CouchDBData(context);

        await d.saveDatum(
          {
            __type: 'collection',
            __id: '1',
            name: 'Collection',
            collection_reference_number: '0001',
          },
          {
            createHistory: {
              createdBy: 'test',
              batch: 1,
              eventName: 'test-creation',
            },
          },
        );

        await d.saveDatum(
          {
            __type: 'collection',
            __id: '1',
            name: 'Collection Updated',
            collection_reference_number: '0002',
          },
          {
            createHistory: {
              createdBy: 'jest',
              batch: 2,
              eventName: 'test-update',
            },
            ignoreConflict: true,
          },
        );

        await d.saveDatum(
          {
            __type: 'collection',
            __id: '1',
            __deleted: true,
          },
          {
            createHistory: {
              createdBy: 'test',
              batch: 3,
              eventName: 'test-deletion',
            },
            ignoreConflict: true,
          },
        );

        expect(await d.getDatumHistories('collection', '1')).toMatchObject([
          {
            created_by: 'test',
            batch: 3,
            event_name: 'test-deletion',
            data_type: 'collection',
            data_id: '1',
            original_data: {
              name: 'Collection Updated',
              collection_reference_number: '0002',
            },
            new_data: {
              __deleted: true,
            },
          },
          {
            created_by: 'jest',
            batch: 2,
            event_name: 'test-update',
            data_type: 'collection',
            data_id: '1',
            original_data: {
              name: 'Collection',
              collection_reference_number: '0001',
            },
            new_data: {
              name: 'Collection Updated',
              collection_reference_number: '0002',
            },
          },
          {
            created_by: 'test',
            batch: 1,
            event_name: 'test-creation',
            data_type: 'collection',
            data_id: '1',
            original_data: {
              __deleted: true,
            },
            new_data: {
              name: 'Collection',
              collection_reference_number: '0001',
            },
          },
        ]);
      });
    });
  });

  describe('getDatumHistories', () => {
    it('supports page and limit', async () => {
      await withContext(async context => {
        const d = new CouchDBData(context);

        await d.saveDatum(
          {
            __type: 'collection',
            __id: '2',
            name: 'Collection',
            collection_reference_number: '2000',
          },
          {
            createHistory: {
              createdBy: 'test',
              batch: 1,
              eventName: 'test-creation',
            },
          },
        );

        await d.saveDatum(
          {
            __type: 'item',
            __id: '1',
            name: 'Item',
            collection_id: '2',
          },
          {
            createHistory: {
              createdBy: 'test',
              batch: 1,
              eventName: 'test-creation',
            },
          },
        );

        await d.saveDatum(
          {
            __type: 'collection',
            __id: '1',
            name: 'Collection',
            collection_reference_number: '0001',
          },
          {
            createHistory: {
              createdBy: 'test',
              batch: 1,
              eventName: 'test-creation',
            },
          },
        );
        await new Promise(resolve => setTimeout(resolve, 2));

        await d.saveDatum(
          {
            __type: 'collection',
            __id: '1',
            name: 'Collection Updated',
            collection_reference_number: '0002',
          },
          {
            createHistory: {
              createdBy: 'jest',
              batch: 2,
              eventName: 'test-update',
            },
            ignoreConflict: true,
          },
        );
        await new Promise(resolve => setTimeout(resolve, 2));

        await d.saveDatum(
          {
            __type: 'collection',
            __id: '1',
            name: 'Collection Updated',
            collection_reference_number: '0003',
          },
          {
            createHistory: {
              createdBy: 'jest',
              batch: 2,
              eventName: 'test-update',
            },
            ignoreConflict: true,
          },
        );
        await new Promise(resolve => setTimeout(resolve, 2));

        await d.saveDatum(
          {
            __type: 'collection',
            __id: '1',
            __deleted: true,
          },
          {
            createHistory: {
              createdBy: 'test',
              batch: 3,
              eventName: 'test-deletion',
            },
            ignoreConflict: true,
          },
        );
        await new Promise(resolve => setTimeout(resolve, 2));

        const allHistories = await d.getDatumHistories('collection', '1', {
          limit: 999,
        });
        expect(allHistories).toHaveLength(4);

        const limitedHistories = await d.getDatumHistories('collection', '1', {
          limit: 2,
        });
        expect(limitedHistories).toHaveLength(2);

        const pagedHistories1 = await d.getDatumHistories('collection', '1', {
          after: allHistories[1].timestamp,
        });
        expect(pagedHistories1).toHaveLength(2);

        const pagedHistories2 = await d.getDatumHistories('collection', '1', {
          after: allHistories[3].timestamp,
        });
        expect(pagedHistories2).toHaveLength(0);

        const limitedAndPagedHistories = await d.getDatumHistories(
          'collection',
          '1',
          {
            after: allHistories[2].timestamp,
            limit: 2,
          },
        );
        expect(limitedAndPagedHistories).toHaveLength(1);
      });
    });
  });

  describe('listHistoryBatchesCreatedBy', () => {
    async function createMockData(d: CouchDBData) {
      await d.saveDatum(
        {
          __type: 'collection',
          __id: '1',
          name: 'Collection 1',
          collection_reference_number: '1000',
        },
        {
          createHistory: {
            createdBy: 'updater-1',
            batch: 1,
            eventName: 'test-creation',
          },
        },
      );

      await d.saveDatum(
        {
          __type: 'item',
          __id: '1',
          name: 'Item 1',
          collection_id: '1',
        },
        {
          createHistory: {
            createdBy: 'updater-1',
            batch: 2,
            eventName: 'test-creation',
          },
        },
      );

      await d.saveDatum(
        {
          __type: 'collection',
          __id: '2',
          name: 'Collection 2',
          collection_reference_number: '2000',
        },
        {
          createHistory: {
            createdBy: 'updater-2',
            batch: 1,
            eventName: 'test-creation',
          },
        },
      );

      await d.saveDatum(
        {
          __type: 'collection',
          __id: '1',
          name: 'Collection 1 Updated',
          collection_reference_number: '1002',
        },
        {
          createHistory: {
            createdBy: 'updater-1',
            batch: 3,
            eventName: 'test-update',
          },
          ignoreConflict: true,
        },
      );

      await d.saveDatum(
        {
          __type: 'collection',
          __id: '1',
          name: 'Collection 1 Updated',
          collection_reference_number: '1003',
        },
        {
          createHistory: {
            createdBy: 'updater-1',
            batch: 4,
            eventName: 'test-update',
          },
          ignoreConflict: true,
        },
      );

      await d.saveDatum(
        {
          __type: 'collection',
          __id: '2',
          name: 'Collection 2 Updated',
          collection_reference_number: '2002',
        },
        {
          createHistory: {
            createdBy: 'updater-2',
            batch: 3,
            eventName: 'test-update',
          },
          ignoreConflict: true,
        },
      );

      await d.saveDatum(
        {
          __type: 'collection',
          __id: '2',
          name: 'Collection 2 Updated',
          collection_reference_number: '2003',
        },
        {
          createHistory: {
            createdBy: 'updater-2',
            batch: 5,
            eventName: 'test-update',
          },
          ignoreConflict: true,
        },
      );
    }

    it('returns batch numbers created by specific creator', async () => {
      await withContext(async context => {
        const d = new CouchDBData(context);

        await createMockData(d);

        expect(await d.listHistoryBatchesCreatedBy('updater-1')).toMatchObject([
          { batch: 4 },
          { batch: 3 },
          { batch: 2 },
          { batch: 1 },
        ]);

        expect(await d.listHistoryBatchesCreatedBy('updater-2')).toMatchObject([
          { batch: 5 },
          { batch: 3 },
          { batch: 1 },
        ]);
      });
    });

    it('supports limit and paging', async () => {
      await withContext(async context => {
        const d = new CouchDBData(context);

        await createMockData(d);

        expect(await d.listHistoryBatchesCreatedBy('updater-1')).toMatchObject([
          { batch: 4 },
          { batch: 3 },
          { batch: 2 },
          { batch: 1 },
        ]);

        expect(
          await d.listHistoryBatchesCreatedBy('updater-1', {
            limit: 2,
          }),
        ).toMatchObject([{ batch: 4 }, { batch: 3 }]);

        expect(
          await d.listHistoryBatchesCreatedBy('updater-1', {
            after: 4,
            limit: 2,
          }),
        ).toMatchObject([{ batch: 3 }, { batch: 2 }]);

        expect(
          await d.listHistoryBatchesCreatedBy('updater-1', {
            after: 3,
            limit: 2,
          }),
        ).toMatchObject([{ batch: 2 }, { batch: 1 }]);

        expect(await d.listHistoryBatchesCreatedBy('updater-2')).toMatchObject([
          { batch: 5 },
          { batch: 3 },
          { batch: 1 },
        ]);

        expect(
          await d.listHistoryBatchesCreatedBy('updater-2', { limit: 1 }),
        ).toMatchObject([{ batch: 5 }]);

        expect(
          await d.listHistoryBatchesCreatedBy('updater-2', {
            after: 5,
            limit: 1,
          }),
        ).toMatchObject([{ batch: 3 }]);

        expect(
          await d.listHistoryBatchesCreatedBy('updater-2', {
            after: 3,
            limit: 1,
          }),
        ).toMatchObject([{ batch: 1 }]);

        expect(
          await d.listHistoryBatchesCreatedBy('updater-2', { after: 1 }),
        ).toMatchObject([]);
      });
    });
  });

  describe('getHistoriesInBatch', () => {
    async function createMockData(d: CouchDBData) {
      await d.saveDatum(
        {
          __type: 'collection',
          __id: '1',
          name: 'Collection 1',
          collection_reference_number: '1000',
        },
        {
          createHistory: {
            createdBy: 'updater-1',
            batch: 1,
            eventName: 'test-creation',
          },
        },
      );

      await d.saveDatum(
        {
          __type: 'item',
          __id: '1',
          name: 'Item 1',
          collection_id: '1',
        },
        {
          createHistory: {
            createdBy: 'updater-1',
            batch: 1,
            eventName: 'test-creation',
          },
        },
      );

      await d.saveDatum(
        {
          __type: 'collection',
          __id: '2',
          name: 'Collection 2',
          collection_reference_number: '2000',
        },
        {
          createHistory: {
            createdBy: 'updater-2',
            batch: 1,
            eventName: 'test-creation',
          },
        },
      );

      await d.saveDatum(
        {
          __type: 'collection',
          __id: '1',
          name: 'Collection 1 Updated',
          collection_reference_number: '1002',
        },
        {
          createHistory: {
            createdBy: 'updater-1',
            batch: 1,
            eventName: 'test-update',
          },
          ignoreConflict: true,
        },
      );

      await d.saveDatum(
        {
          __type: 'collection',
          __id: '1',
          name: 'Collection 1 Updated',
          collection_reference_number: '1003',
        },
        {
          createHistory: {
            createdBy: 'updater-1',
            batch: 2,
            eventName: 'test-update',
          },
          ignoreConflict: true,
        },
      );

      await d.saveDatum(
        {
          __type: 'collection',
          __id: '2',
          name: 'Collection 2 Updated',
          collection_reference_number: '2002',
        },
        {
          createHistory: {
            createdBy: 'updater-2',
            batch: 2,
            eventName: 'test-update',
          },
          ignoreConflict: true,
        },
      );

      await d.saveDatum(
        {
          __type: 'collection',
          __id: '2',
          name: 'Collection 2 Updated',
          collection_reference_number: '2003',
        },
        {
          createHistory: {
            createdBy: 'updater-2',
            batch: 3,
            eventName: 'test-update',
          },
          ignoreConflict: true,
        },
      );
    }

    it('returns histories that have a specific batch number', async () => {
      await withContext(async context => {
        const d = new CouchDBData(context);

        await createMockData(d);

        expect(await d.getHistoriesInBatch(1)).toMatchObject([
          {
            batch: 1,
            created_by: 'updater-1',
            data_type: 'collection',
            data_id: '1',
            event_name: 'test-creation',
          },
          {
            batch: 1,
            created_by: 'updater-1',
            data_type: 'item',
            data_id: '1',
            event_name: 'test-creation',
          },
          {
            batch: 1,
            created_by: 'updater-1',
            data_type: 'collection',
            data_id: '1',
            event_name: 'test-update',
          },
          {
            batch: 1,
            created_by: 'updater-2',
            data_type: 'collection',
            data_id: '2',
            event_name: 'test-creation',
          },
        ]);

        expect(await d.getHistoriesInBatch(2)).toMatchObject([
          {
            batch: 2,
            created_by: 'updater-1',
            data_type: 'collection',
            data_id: '1',
            event_name: 'test-update',
          },
          {
            batch: 2,
            created_by: 'updater-2',
            data_type: 'collection',
            data_id: '2',
            event_name: 'test-update',
          },
        ]);

        expect(await d.getHistoriesInBatch(3)).toMatchObject([
          {
            batch: 3,
            created_by: 'updater-2',
            data_type: 'collection',
            data_id: '2',
            event_name: 'test-update',
          },
        ]);

        expect(await d.getHistoriesInBatch(4)).toMatchObject([]);
      });
    });

    it('returns histories that have a specific batch number and created_by value', async () => {
      await withContext(async context => {
        const d = new CouchDBData(context);

        await createMockData(d);

        expect(
          await d.getHistoriesInBatch(1, { createdBy: 'updater-1' }),
        ).toMatchObject([
          {
            batch: 1,
            created_by: 'updater-1',
            data_type: 'collection',
            data_id: '1',
            event_name: 'test-creation',
          },
          {
            batch: 1,
            created_by: 'updater-1',
            data_type: 'item',
            data_id: '1',
            event_name: 'test-creation',
          },
          {
            batch: 1,
            created_by: 'updater-1',
            data_type: 'collection',
            data_id: '1',
            event_name: 'test-update',
          },
        ]);

        expect(
          await d.getHistoriesInBatch(1, { createdBy: 'updater-2' }),
        ).toMatchObject([
          {
            batch: 1,
            created_by: 'updater-2',
            data_type: 'collection',
            data_id: '2',
            event_name: 'test-creation',
          },
        ]);

        expect(
          await d.getHistoriesInBatch(2, { createdBy: 'updater-1' }),
        ).toMatchObject([
          {
            batch: 2,
            created_by: 'updater-1',
            data_type: 'collection',
            data_id: '1',
            event_name: 'test-update',
          },
        ]);

        expect(
          await d.getHistoriesInBatch(3, { createdBy: 'updater-1' }),
        ).toMatchObject([]);

        expect(
          await d.getHistoriesInBatch(4, { createdBy: 'updater-1' }),
        ).toMatchObject([]);
      });
    });
  });

  describe('restoreHistory', () => {
    async function createMockData(d: CouchDBData) {
      await d.saveDatum(
        {
          __type: 'collection',
          __id: '1',
          name: 'Collection 1',
          collection_reference_number: '1000',
        },
        {
          createHistory: {
            createdBy: 'updater-1',
            batch: 1,
            eventName: 'test-creation',
          },
        },
      );

      await d.saveDatum(
        {
          __type: 'collection',
          __id: '1',
          name: 'Collection 1 Updated',
          collection_reference_number: '1002',
        },
        {
          createHistory: {
            createdBy: 'updater-1',
            batch: 1,
            eventName: 'test-update',
          },
          ignoreConflict: true,
        },
      );

      await d.saveDatum(
        {
          __type: 'collection',
          __id: '1',
          name: 'Collection 1 Updated',
          collection_reference_number: '1003',
        },
        {
          createHistory: {
            createdBy: 'updater-1',
            batch: 2,
            eventName: 'test-update',
          },
          ignoreConflict: true,
        },
      );
    }

    it('can restore created data', async () => {
      await withContext(async context => {
        const d = new CouchDBData(context);

        await createMockData(d);

        expect(await d.getDatum('collection', '1')).toMatchObject({
          __type: 'collection',
          __id: '1',
        });

        const histories = await d.getDatumHistories('collection', '1');
        const firstHistory = histories[histories.length - 1];
        expect(firstHistory).toMatchObject({
          original_data: {
            __deleted: true,
          },
        });

        await d.restoreHistory(firstHistory);

        expect(await d.getDatum('collection', '1')).toBe(null);
      });
    });

    it('can restore updated data', async () => {
      await withContext(async context => {
        const d = new CouchDBData(context);

        await createMockData(d);

        expect(await d.getDatum('collection', '1')).toMatchObject({
          __type: 'collection',
          __id: '1',
          name: 'Collection 1 Updated',
          collection_reference_number: '1003',
        });

        const histories = await d.getDatumHistories('collection', '1');

        expect(histories[0]).toMatchObject({
          original_data: {
            collection_reference_number: '1002',
          },
        });
        await d.restoreHistory(histories[0]);

        expect(await d.getDatum('collection', '1')).toMatchObject({
          __type: 'collection',
          __id: '1',
          name: 'Collection 1 Updated',
          collection_reference_number: '1002',
        });

        expect(histories[1]).toMatchObject({
          original_data: {
            name: 'Collection 1',
            collection_reference_number: '1000',
          },
        });
        await d.restoreHistory(histories[1]);

        expect(await d.getDatum('collection', '1')).toMatchObject({
          __type: 'collection',
          __id: '1',
          name: 'Collection 1',
          collection_reference_number: '1000',
        });
      });
    });

    it('can restore deleted data', async () => {
      await withContext(async context => {
        const d = new CouchDBData(context);

        await createMockData(d);

        await d.saveDatum(
          {
            __type: 'collection',
            __id: '1',
            __deleted: true,
          },
          {
            createHistory: {
              createdBy: 'updater-1',
              batch: 3,
              eventName: 'test-delete',
            },
            ignoreConflict: true,
          },
        );

        expect(await d.getDatum('collection', '1')).toBe(null);

        const histories = await d.getDatumHistories('collection', '1');
        const lastHistory = histories[0];
        expect(lastHistory).toMatchObject({
          original_data: {
            name: 'Collection 1 Updated',
            collection_reference_number: '1003',
          },
          new_data: {
            __deleted: true,
          },
        });

        await d.restoreHistory(lastHistory);

        expect(await d.getDatum('collection', '1')).toMatchObject({
          __type: 'collection',
          __id: '1',
          name: 'Collection 1 Updated',
          collection_reference_number: '1003',
        });
      });
    });

    it('throws error if restoring will cause an invalid datum', async () => {
      await withContext(async context => {
        const d = new CouchDBData(context);

        await createMockData(d);

        await d.saveDatum({
          __type: 'collection',
          __id: '2',
          name: 'Collection to make collection_reference_number collision on restore',
          collection_reference_number: '1002',
        });

        expect(await d.getDatum('collection', '1')).toMatchObject({
          __type: 'collection',
          __id: '1',
          name: 'Collection 1 Updated',
          collection_reference_number: '1003',
        });

        const histories = await d.getDatumHistories('collection', '1');

        expect(histories[0]).toMatchObject({
          original_data: {
            collection_reference_number: '1002',
          },
        });

        try {
          // Should throw because collection_reference_number is used
          await d.restoreHistory(histories[0]);
          throw new NoErrorThrownError();
        } catch (error) {
          if (error instanceof NoErrorThrownError) {
            throw new Error(
              'Expects an error to be thrown, but none was thrown',
            );
          }

          expect(error).toBeInstanceOf(ValidationError);
          expect(
            error instanceof ValidationError ? error.issues : [],
          ).toMatchSnapshot(
            'collection collection_reference_number already used',
          );
        }
      });
    });

    it('creates new history on restore', async () => {
      await withContext(async context => {
        const d = new CouchDBData(context);

        await createMockData(d);

        expect(await d.getDatum('collection', '1')).toMatchObject({
          __type: 'collection',
          __id: '1',
          name: 'Collection 1 Updated',
          collection_reference_number: '1003',
        });

        const histories = await d.getDatumHistories('collection', '1');

        expect(histories[0]).toMatchObject({
          original_data: {
            collection_reference_number: '1002',
          },
        });
        await d.restoreHistory(histories[0], { batch: 1337 });

        expect(await d.getDatum('collection', '1')).toMatchObject({
          __type: 'collection',
          __id: '1',
          name: 'Collection 1 Updated',
          collection_reference_number: '1002',
        });

        const newHistories = await d.getDatumHistories('collection', '1');

        expect(newHistories[0]).toMatchObject({
          created_by: 'history_restore',
          batch: 1337,
          original_data: {
            collection_reference_number: '1003',
          },
          new_data: {
            collection_reference_number: '1002',
          },
        });
        await d.restoreHistory(newHistories[0], { batch: 2048 });

        expect(await d.getDatum('collection', '1')).toMatchObject({
          __type: 'collection',
          __id: '1',
          name: 'Collection 1 Updated',
          collection_reference_number: '1003',
        });

        expect((await d.getDatumHistories('collection', '1'))[0]).toMatchObject(
          {
            created_by: 'history_restore',
            batch: 2048,
            original_data: {
              collection_reference_number: '1002',
            },
            new_data: {
              collection_reference_number: '1003',
            },
          },
        );
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

describe('getChildrenItems', () => {
  it('returns contents of each item ID provided', async () => {
    await withContext(async context => {
      const d = new CouchDBData(context);

      const collection = await d.saveDatum({
        __id: 'collection-a',
        __type: 'collection',
        name: 'Collection',
        icon_name: 'box',
        icon_color: 'gray',
        collection_reference_number: '1',
      });

      await d.saveDatum({
        __type: 'item',
        __id: '1',
        collection_id: 'collection-a',
        item_type: 'container',
        name: 'Container 1',
      });

      await d.saveDatum({
        __type: 'item',
        __id: '1-1',
        collection_id: 'collection-a',
        container_id: '1',
        name: 'Item 1-1',
      });
      await d.saveDatum({
        __type: 'item',
        __id: '1-2',
        collection_id: 'collection-a',
        container_id: '1',
        name: 'Item 1-2',
      });

      await d.saveDatum({
        __type: 'item',
        __id: '2',
        collection_id: 'collection-a',
        item_type: 'container',
        name: 'Container 2',
      });

      await d.saveDatum({
        __type: 'item',
        __id: '2-1',
        collection_id: 'collection-a',
        container_id: '2',
        name: 'Item 2-1',
      });
      await d.saveDatum({
        __type: 'item',
        __id: '2-2',
        collection_id: 'collection-a',
        container_id: '2',
        name: 'Item 2-2',
      });
      await d.saveDatum({
        __type: 'item',
        __id: '2-2',
        collection_id: 'collection-a',
        container_id: '2',
        name: 'Item 2-3',
      });

      const results = await getChildrenItems(['1', '2'], {
        getDatum: d.getDatum,
        getData: d.getData,
      });

      const resultIds = Object.fromEntries(
        Object.entries(results).map(([k, v]) => [k, v.map(it => it.__id)]),
      );

      expect(resultIds).toMatchObject({
        '1': ['1-1', '1-2'],
        '2': ['2-1', '2-2'],
      });
    });
  });

  it('returns IDs under nested containers', async () => {
    await withContext(async context => {
      const d = new CouchDBData(context);

      const collection = await d.saveDatum({
        __id: 'collection-a',
        __type: 'collection',
        name: 'Collection',
        icon_name: 'box',
        icon_color: 'gray',
        collection_reference_number: '1',
      });

      await d.saveDatum({
        __type: 'item',
        __id: '1',
        collection_id: 'collection-a',
        item_type: 'container',
        name: 'Container 1',
      });

      await d.saveDatum({
        __type: 'item',
        __id: '1-1',
        collection_id: 'collection-a',
        container_id: '1',
        item_type: 'container',
        name: 'Container 1-1',
      });

      await d.saveDatum({
        __type: 'item',
        __id: '1-1-1',
        collection_id: 'collection-a',
        container_id: '1-1',
        item_type: 'container',
        name: 'Container 1-1-1',
      });

      await d.saveDatum({
        __type: 'item',
        __id: '1-1-1-1',
        collection_id: 'collection-a',
        container_id: '1-1-1',
        item_type: 'container',
        name: 'Container 1-1-1-1',
      });

      await d.saveDatum({
        __type: 'item',
        __id: '1-1-1-1-1',
        collection_id: 'collection-a',
        container_id: '1-1-1-1',
        item_type: 'container',
        name: 'Container 1-1-1-1-1',
      });

      await d.saveDatum({
        __type: 'item',
        __id: '1-1-1-2',
        collection_id: 'collection-a',
        container_id: '1-1-1',
        item_type: 'container',
        name: 'Container 1-1-1-2',
      });

      await d.saveDatum({
        __type: 'item',
        __id: '1-2',
        collection_id: 'collection-a',
        container_id: '1',
        item_type: 'container',
        name: 'Container 1-2',
      });

      await d.saveDatum({
        __type: 'item',
        __id: '1-2-1',
        collection_id: 'collection-a',
        container_id: '1-2',
        item_type: 'container',
        name: 'Container 1-2-1',
      });

      await d.saveDatum({
        __type: 'item',
        __id: '1-3',
        collection_id: 'collection-a',
        container_id: '1',
        item_type: 'container',
        name: 'Container 1-3',
      });

      await d.saveDatum({
        __type: 'item',
        __id: '2',
        collection_id: 'collection-a',
        item_type: 'container',
        name: 'Container 2',
      });

      await d.saveDatum({
        __type: 'item',
        __id: '2-1',
        collection_id: 'collection-a',
        container_id: '2',
        item_type: 'container',
        name: 'Container 2-1',
      });

      await d.saveDatum({
        __type: 'item',
        __id: '2-1-1',
        collection_id: 'collection-a',
        container_id: '2-1',
        item_type: 'container',
        name: 'Container 2-1-1',
      });

      await d.saveDatum({
        __type: 'item',
        __id: '2-1-2',
        collection_id: 'collection-a',
        container_id: '2-1',
        item_type: 'container',
        name: 'Container 2-1-2',
      });

      await d.saveDatum({
        __type: 'item',
        __id: '2-2',
        collection_id: 'collection-a',
        container_id: '2',
        item_type: 'container',
        name: 'Container 2-2',
      });

      const results = await getChildrenItems(['1', '2', '3'], {
        getDatum: d.getDatum,
        getData: d.getData,
      });

      const resultIds = Object.fromEntries(
        Object.entries(results).map(([k, v]) => [k, v.map(it => it.__id)]),
      );

      expect(resultIds).toMatchObject({
        '1': ['1-1', '1-2', '1-3'],
        '2': ['2-1', '2-2'],
        '1-1': ['1-1-1'],
        '1-1-1': ['1-1-1-1', '1-1-1-2'],
        '1-1-1-1': ['1-1-1-1-1'],
        '1-1-1-1-1': [],
        '1-1-1-2': [],
        '1-2': ['1-2-1'],
        '1-2-1': [],
        '1-3': [],
        '2-1': ['2-1-1', '2-1-2'],
        '2-1-1': [],
        '2-1-2': [],
        '2-2': [],
      });
    });
  });

  it('will not return ids for items that cannot contain items', async () => {
    await withContext(async context => {
      const d = new CouchDBData(context);

      const collection = await d.saveDatum({
        __id: 'collection-a',
        __type: 'collection',
        name: 'Collection',
        icon_name: 'box',
        icon_color: 'gray',
        collection_reference_number: '1',
      });

      await d.saveDatum({
        __type: 'item',
        __id: '1',
        collection_id: 'collection-a',
        item_type: 'container',
        name: 'Container 1',
      });

      await d.saveDatum({
        __type: 'item',
        __id: '1-1',
        collection_id: 'collection-a',
        container_id: '1',
        item_type: 'container',
        name: 'Container 1-1',
      });

      await d.saveDatum({
        __type: 'item',
        __id: '1-1-1',
        collection_id: 'collection-a',
        container_id: '1-1',
        name: 'Item 1-1-1',
      });

      await d.saveDatum({
        __type: 'item',
        __id: '1-2',
        collection_id: 'collection-a',
        container_id: '1',
        name: 'Item 1-2',
      });

      await d.saveDatum(
        {
          __type: 'item',
          __id: '1-2-1',
          collection_id: 'collection-a',
          container_id: '1-2-1',
          name: 'Item 1-2-1',
        },
        { skipValidation: true },
      );

      await d.saveDatum({
        __type: 'item',
        __id: '2',
        collection_id: 'collection-a',
        name: 'Item 2',
      });

      await d.saveDatum(
        {
          __type: 'item',
          __id: '2-1',
          collection_id: 'collection-a',
          container_id: '2',
          name: 'Item 2-1',
        },
        { skipValidation: true },
      );
      await d.saveDatum(
        {
          __type: 'item',
          __id: '2-2',
          collection_id: 'collection-a',
          container_id: '2',
          name: 'Item 2-2',
        },
        { skipValidation: true },
      );

      const results = await getChildrenItems(['1', '2'], {
        getDatum: d.getDatum,
        getData: d.getData,
      });

      const resultIds = Object.fromEntries(
        Object.entries(results).map(([k, v]) => [k, v.map(it => it.__id)]),
      );

      expect(resultIds).toMatchObject({
        '1': ['1-1', '1-2'],
        '1-1': ['1-1-1'],
      });
    });
  });

  it('works with circular references', async () => {
    await withContext(async context => {
      const d = new CouchDBData(context);

      const collection = await d.saveDatum({
        __id: 'collection-a',
        __type: 'collection',
        name: 'Collection',
        icon_name: 'box',
        icon_color: 'gray',
        collection_reference_number: '1',
      });

      const container1 = await d.saveDatum({
        __type: 'item',
        __id: '1',
        collection_id: 'collection-a',
        item_type: 'container',
        name: 'Container 1',
      });
      await d.saveDatum({
        __type: 'item',
        __id: '2',
        collection_id: 'collection-a',
        container_id: '1',
        item_type: 'container',
        name: 'Container 2',
      });
      await d.saveDatum({
        __type: 'item',
        __id: '3',
        collection_id: 'collection-a',
        container_id: '2',
        item_type: 'container',
        name: 'Container 3',
      });
      await d.saveDatum(
        {
          ...container1,
          container_id: '3',
        },
        { skipValidation: true },
      );

      const results = await getChildrenItems(['1'], {
        getDatum: d.getDatum,
        getData: d.getData,
      });

      const resultIds = Object.fromEntries(
        Object.entries(results).map(([k, v]) => [k, v.map(it => it.__id)]),
      );

      expect(resultIds).toMatchObject({
        '1': ['2'],
        '2': ['3'],
        '3': ['1'],
      });
    });
  });

  it('sorts ids by contents_order then __created_at', async () => {
    await withContext(async context => {
      const d = new CouchDBData(context);

      const collection = await d.saveDatum({
        __id: 'collection-a',
        __type: 'collection',
        name: 'Collection',
        icon_name: 'box',
        icon_color: 'gray',
        collection_reference_number: '1',
      });

      await d.saveDatum({
        __type: 'item',
        __id: '1',
        collection_id: 'collection-a',
        item_type: 'container',
        name: 'Container 1',
        contents_order: ['1-4', '1-3'],
      });

      await d.saveDatum({
        __type: 'item',
        __id: '1-1',
        collection_id: 'collection-a',
        container_id: '1',
        item_type: 'container',
        name: 'Container 1-1',
        contents_order: ['1-1-3', '1-1-4'],
      });

      await d.saveDatum({
        __type: 'item',
        __id: '1-1-1',
        collection_id: 'collection-a',
        container_id: '1-1',
        name: 'Item 1-1-1',
      });
      await d.saveDatum({
        __type: 'item',
        __id: '1-1-2',
        collection_id: 'collection-a',
        container_id: '1-1',
        name: 'Item 1-1-2',
      });
      await d.saveDatum({
        __type: 'item',
        __id: '1-1-3',
        collection_id: 'collection-a',
        container_id: '1-1',
        name: 'Item 1-1-3',
      });
      await d.saveDatum({
        __type: 'item',
        __id: '1-1-4',
        collection_id: 'collection-a',
        container_id: '1-1',
        name: 'Item 1-1-4',
      });

      await d.saveDatum({
        __type: 'item',
        __id: '1-2',
        collection_id: 'collection-a',
        container_id: '1',
        name: 'Item 1-2',
      });

      await d.saveDatum({
        __type: 'item',
        __id: '1-3',
        collection_id: 'collection-a',
        container_id: '1',
        name: 'Item 1-3',
      });

      await d.saveDatum({
        __type: 'item',
        __id: '1-4',
        collection_id: 'collection-a',
        container_id: '1',
        name: 'Item 1-4',
      });

      const results = await getChildrenItems(['1'], {
        getDatum: d.getDatum,
        getData: d.getData,
      });

      const resultIds = Object.fromEntries(
        Object.entries(results).map(([k, v]) => [k, v.map(it => it.__id)]),
      );

      expect(resultIds).toMatchObject({
        '1': ['1-4', '1-3', '1-1', '1-2'],
        '1-1': ['1-1-3', '1-1-4', '1-1-1', '1-1-2'],
      });
    });
  });
});
