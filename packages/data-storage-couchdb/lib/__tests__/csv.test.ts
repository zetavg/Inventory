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
  const db = new PouchDB(`.temp_dbs/pouchdb-test-csv-${contextID}`, {
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

describe('itemToCsvRow', () => {
  it('works', async () => {
    await withContext(async context => {
      const d = new CouchDBData(context);

      const collection = await d.saveDatum({
        __id: 'collection-1',
        __type: 'collection',
        name: 'Collection',
        icon_name: 'box',
        icon_color: 'gray',
        collection_reference_number: '1',
      });

      const container = await d.saveDatum({
        __id: 'container-1',
        __type: 'item',
        collection_id: collection.__id,
        name: 'Container',
        icon_name: 'cube-outline',
        icon_color: 'gray',
        item_type: 'container',
      });

      const item = await d.saveDatum({
        __type: 'item',
        collection_id: collection.__id,
        container_id: container.__id,
        name: 'Item',
        icon_name: 'cube-outline',
        icon_color: 'gray',
        model_name: 'Model A',
      });

      const csvRow = await d.itemToCsvRow(item as any);
      const { ID: _, ...csvRowWithoudId } = csvRow;
      expect(csvRowWithoudId).toMatchSnapshot();
    });
  });
});

describe('csvRowToItem', () => {
  it('works for new item', async () => {
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
        icon_name: 'cube-outline',
        icon_color: 'gray',
        item_type: 'container',
      });

      const newItem = await d.csvRowToItem({
        Name: 'New Item',
        'Container ID': container.__id || '',
        'Collection Ref. No.': "'0001",
      });
      expect(newItem.collection_id).toEqual(collection.__id);
      expect(newItem.container_id).toEqual(container.__id);
    });
  });

  it('works for existing item', async () => {
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
        icon_name: 'cube-outline',
        icon_color: 'gray',
        item_type: 'container',
      });

      const item = await d.saveDatum({
        __type: 'item',
        collection_id: collection.__id,
        container_id: container.__id,
        name: 'Item',
        icon_name: 'cube-outline',
        icon_color: 'blue',
        model_name: 'Model A',
      });

      const updateItem = await d.csvRowToItem({
        ID: item.__id || '',
        Name: 'Update Item',
        'Container ID': container.__id || '',
        'Collection Ref. No.': "'0001",
      });
      expect(updateItem.collection_id).toEqual(collection.__id);
      expect(updateItem.container_id).toEqual(container.__id);
      expect(updateItem.name).toEqual('Update Item');
      expect(updateItem.icon_color).toEqual('blue');
      expect(updateItem.model_name).toEqual('Model A');
    });
  });
});
