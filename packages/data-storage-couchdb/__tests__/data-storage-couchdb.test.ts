import PouchDB from 'pouchdb';

import { CouchDBData } from '../lib';
import { Context } from '../lib/functions/types';

PouchDB.plugin(require('pouchdb-find'));
const openDatabase = require('websql');
const SQLiteAdapter = require('pouchdb-adapter-react-native-sqlite/lib')({
  openDatabase,
});
PouchDB.plugin(SQLiteAdapter);

let contextCounter = 0;
async function withContext(fn: (c: Context) => Promise<void>) {
  const db = new PouchDB(`.temp_dbs/pouchdb-test-${contextCounter}`, {
    adapter: 'react-native-sqlite',
  });
  // contextCounter += 1;

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
  });
});
