import { readString } from 'react-native-csv';

import setMockData from '@app/data/functions/setMockData';

import csvRowToItem from './csvRowToItem';

const db: PouchDB.Database = {} as any;

export const SIMPLE_WITHOUT_ID_CSV = `
ID,Collection Ref. No.,Reference No.,Serial,Name
,0001,123456,1,Item 1
,0001,123456,2,Item 2
`.trim();

export const EXISTING_ITEMS_CSV = `
ID,Collection Ref. No.,Reference No.,Serial,Name
a,0001,123456,1,Item 1
b,0001,,0,Item 2
`.trim();

describe('csvRowToItem', () => {
  beforeAll(async () => {
    // Collection
    await setMockData('collection', [
      {
        __type: 'collection',
        __id: '1',
        name: 'Collection',
        collection_reference_number: '0001',
        icon_name: 'box',
        icon_color: 'blue',
        __created_at: 0,
        __updated_at: 0,
        __valid: true,
        __raw: null,
      },
    ]);

    // Existing Items
    await setMockData('item', [
      {
        __type: 'item',
        __id: 'a',
        name: 'Item A',
        icon_name: 'food',
        icon_color: 'red',
        collection_id: '1',
        item_reference_number: '0001',
        notes: 'Item A notes.',
        __created_at: 0,
        __updated_at: 0,
        __valid: true,
        __raw: null,
      },
      {
        __type: 'item',
        __id: 'b',
        name: 'Item B',
        icon_name: 'food',
        icon_color: 'red',
        collection_id: '1',
        item_reference_number: '0002',
        notes: 'Item B notes.',
        __created_at: 0,
        __updated_at: 0,
        __valid: true,
        __raw: null,
      },
    ]);
  });

  it('generates new IDs for rows not containing an ID', async () => {
    const csv = readString(SIMPLE_WITHOUT_ID_CSV, { header: true });
    const loadedRefNoCollectionsMap = new Map();

    const items = await Promise.all(
      csv.data.map((r: any) =>
        csvRowToItem(r, { db, loadedRefNoCollectionsMap }),
      ),
    );

    expect(
      items.every(
        item => typeof item.__id === 'string' && item.__id.length > 0,
      ),
    ).toBe(true);
  });

  it('fills collection_id with the collection with corresponding reference number', async () => {
    const csv = readString(SIMPLE_WITHOUT_ID_CSV, { header: true });
    const loadedRefNoCollectionsMap = new Map();

    const items = await Promise.all(
      csv.data.map((r: any) =>
        csvRowToItem(r, { db, loadedRefNoCollectionsMap }),
      ),
    );

    const item = items[0];
    expect(item.collection_id).toBe('1');
  });

  it('fills default values', async () => {
    const csv = readString(SIMPLE_WITHOUT_ID_CSV, { header: true });
    const loadedRefNoCollectionsMap = new Map();

    const items = await Promise.all(
      csv.data.map((r: any) =>
        csvRowToItem(r, { db, loadedRefNoCollectionsMap }),
      ),
    );

    expect(
      items.every(
        item => typeof item.icon_name === 'string' && item.icon_name.length > 0,
      ),
    ).toBe(true);

    expect(
      items.every(
        item =>
          typeof item.icon_color === 'string' && item.icon_color.length > 0,
      ),
    ).toBe(true);

    expect(items.every(item => item.__valid)).toBe(true);
  });

  it('load existing item data', async () => {
    const csv = readString(EXISTING_ITEMS_CSV, { header: true });
    const loadedRefNoCollectionsMap = new Map();

    const items = await Promise.all(
      csv.data.map((r: any) =>
        csvRowToItem(r, { db, loadedRefNoCollectionsMap }),
      ),
    );

    const item = items[0];
    expect(item.notes).toBe('Item A notes.');
  });
});
