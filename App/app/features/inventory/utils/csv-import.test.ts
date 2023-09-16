import { readString } from 'react-native-csv';

import setMockData from '@app/data/functions/setMockData';
import { getValidationResultMessage } from '@app/data/validation';

import { classifyItems, getItemsFromCsv, processItems } from './csv-import';

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

const CONFIG_UUID = 'mock-config-uuid';

describe('csv-import', () => {
  beforeAll(async () => {
    // Collection
    await setMockData('collection', [
      {
        __type: 'collection',
        __id: '1',
        name: 'Collection 0001',
        collection_reference_number: '0001',
        icon_name: 'box',
        icon_color: 'blue',
        config_uuid: CONFIG_UUID,
        __created_at: 0,
        __updated_at: 0,
        __valid: true,
        __raw: null,
      },
      {
        __type: 'collection',
        __id: '2',
        name: 'Collection 0002',
        collection_reference_number: '0002',
        icon_name: 'box',
        icon_color: 'blue',
        config_uuid: CONFIG_UUID,
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
        __id: 'container-1',
        collection_id: '1',
        name: 'Container',
        item_type: 'container',
        icon_name: 'box',
        icon_color: 'blue',
        config_uuid: CONFIG_UUID,
        __created_at: 0,
        __updated_at: 0,
        __valid: true,
        __raw: null,
      },
      {
        __type: 'item',
        __id: '1-a',
        collection_id: '1',
        name: 'Item 0001-A',
        icon_name: 'food',
        icon_color: 'red',
        item_reference_number: '0001',
        notes: 'Item A notes.',
        purchase_date: 1672502400,
        config_uuid: CONFIG_UUID,
        __created_at: 0,
        __updated_at: 0,
        __valid: true,
        __raw: null,
      },
      {
        __type: 'item',
        __id: '1-b',
        collection_id: '1',
        name: 'Item 0001-B',
        icon_name: 'food',
        icon_color: 'red',
        item_reference_number: '0002',
        notes: 'Item B notes.',
        purchase_date: 1672502400,
        config_uuid: CONFIG_UUID,
        __created_at: 0,
        __updated_at: 0,
        __valid: true,
        __raw: null,
      },
      {
        __type: 'item',
        __id: '2-a',
        collection_id: '2',
        name: 'Item 0002-A',
        icon_name: 'food',
        icon_color: 'red',
        item_reference_number: '2001',
        notes: 'Item A notes.',
        purchase_date: 1672502400,
        config_uuid: CONFIG_UUID,
        __created_at: 0,
        __updated_at: 0,
        __valid: true,
        __raw: null,
      },
      {
        __type: 'item',
        __id: '2-b',
        collection_id: '2',
        name: 'Item 0002-B',
        icon_name: 'food',
        icon_color: 'red',
        item_reference_number: '2002',
        notes: 'Item B notes.',
        purchase_date: 1672502400,
        config_uuid: CONFIG_UUID,
        __created_at: 0,
        __updated_at: 0,
        __valid: true,
        __raw: null,
      },
    ]);
  });

  it('can produce items to create', async () => {
    const csvLines = [
      'ID,Collection Ref. No.,Reference No.,Serial,Name',
      "new-1,'0001,'123456,1,New Item 1", // with pre-filled ID
      ",'0002,'123456,2,New Item 2", // without ID
    ];
    const csv = readString(csvLines.join('\n'), { header: true });
    const items = await getItemsFromCsv(csv.data, { db });
    const { processedItems, issuesMap } = await processItems(items, {
      db,
    });
    const { validItems, invalidItems, itemsToCreate, itemsToUpdate } =
      classifyItems(processedItems, {
        itemIssues: issuesMap,
      });
    expect(validItems.length).toBe(2);
    expect(invalidItems.length).toBe(0);
    expect(itemsToCreate.length).toBe(2);
    expect(itemsToUpdate.length).toBe(0);
    expect(itemsToCreate[0].name).toBe('New Item 1');
    expect(itemsToCreate[1].name).toBe('New Item 2');
    expect(itemsToCreate[0].__id).toBe('new-1');
    expect(typeof itemsToCreate[1].__id).toBe('string');
    expect(itemsToCreate[1].__id?.length).toBe(36); // Generated UUID
    expect(itemsToCreate[0].individual_asset_reference).toBe(
      '0001.123456.0001',
    );
    expect(itemsToCreate[1].individual_asset_reference).toBe(
      '0002.123456.0002',
    );
    expect(itemsToCreate[0].rfid_tag_epc_memory_bank_contents).toBe(
      '34140000002386F50D62C801',
    );
    expect(itemsToCreate[1].rfid_tag_epc_memory_bank_contents).toBe(
      '34140000002386F7616EAC02',
    );
  });
  it('can produce items to update', async () => {
    const csvLines = [
      'ID,Collection Ref. No.,Reference No.,Serial,Name',
      '1-a,0001,123456,1,Update Item 1',
      "2-b,'0002,'123456,2,Update Item 2",
    ];
    const csv = readString(csvLines.join('\n'), { header: true });
    const items = await getItemsFromCsv(csv.data, { db });
    const { processedItems, issuesMap } = await processItems(items, {
      db,
    });
    const { validItems, invalidItems, itemsToCreate, itemsToUpdate } =
      classifyItems(processedItems, {
        itemIssues: issuesMap,
      });
    expect(validItems.length).toBe(2);
    expect(invalidItems.length).toBe(0);
    expect(itemsToCreate.length).toBe(0);
    expect(itemsToUpdate.length).toBe(2);

    expect(typeof itemsToUpdate[0].__id).toBe('string');
    expect(typeof itemsToUpdate[1].__id).toBe('string');

    // Loads old data
    expect(itemsToUpdate[0].notes).toBe('Item A notes.');
    expect(itemsToUpdate[1].notes).toBe('Item B notes.');

    // Updates data
    expect(itemsToUpdate[0].name).toBe('Update Item 1');
    expect(itemsToUpdate[1].name).toBe('Update Item 2');
    expect(itemsToUpdate[0].individual_asset_reference).toBe(
      '0001.123456.0001',
    );
    expect(itemsToUpdate[1].individual_asset_reference).toBe(
      '0002.123456.0002',
    );
    expect(itemsToUpdate[0].rfid_tag_epc_memory_bank_contents).toBe(
      '34140000002386F50D62C801',
    );
    expect(itemsToUpdate[1].rfid_tag_epc_memory_bank_contents).toBe(
      '34140000002386F7616EAC02',
    );
  });

  it('will check if items violates schema', async () => {
    const csvLines = [
      'ID,Collection Ref. No.,Reference No.,Serial,Name',
      "new-1,this-is-invalid,'123456,1,New Item 1",
      ",'0002,'this-is-invalid,2,New Item 2",
      '1-a,0001,123456,this-is-invalid,Update Item 1',
    ];
    const csv = readString(csvLines.join('\n'), { header: true });
    const items = await getItemsFromCsv(csv.data, { db });
    const { processedItems, issuesMap } = await processItems(items, {
      db,
    });
    const { validItems, invalidItems, itemsToCreate, itemsToUpdate } =
      classifyItems(processedItems, {
        itemIssues: issuesMap,
      });
    expect(validItems.length).toBe(0);
    expect(invalidItems.length).toBe(3);
    expect(itemsToCreate.length).toBe(0);
    expect(itemsToUpdate.length).toBe(0);
  });

  it('will check if items violates validation', async () => {
    const csvLines = [
      'ID,Collection Ref. No.,Reference No.,Serial,Name,Container ID',
      'new-1,0001,123456,1,New Item 1,container-1', // Valid
      'new-2,0001,0001,,New Item 2,', // Duplicated IAR
      'new-3,0001,123456,1,New Item 3,id-not-exists', // Container does not exist
      'new-3,0001,123456,1,New Item 3,1-a', // Item is not a container
    ];
    const csv = readString(csvLines.join('\n'), { header: true });
    const items = await getItemsFromCsv(csv.data, { db });
    const { processedItems, issuesMap } = await processItems(items, {
      db,
    });
    const { validItems, invalidItems, itemsToCreate, itemsToUpdate } =
      classifyItems(processedItems, {
        itemIssues: issuesMap,
      });
    expect(validItems.length).toBe(1);
    expect(invalidItems.length).toBe(3);
    expect(itemsToCreate.length).toBe(1);
    expect(itemsToUpdate.length).toBe(0);

    expect(getValidationResultMessage(issuesMap.get(items[1]))).toBe(
      'Item Reference Number: individual asset reference should be unique, but "0001.0001.0000" is already used by item "item 0001-a" (id: 1-a)',
    );
    expect(getValidationResultMessage(issuesMap.get(items[2]))).toBe(
      'Container Id: can\'t find item with id "id-not-exists"',
    );
    expect(getValidationResultMessage(issuesMap.get(items[3]))).toBe(
      'Container Id: item with id "1-a" can not be a container',
    );
  });

  it('will override field if presented in CSV and is blank', async () => {
    const csvLines = [
      'ID,Name,Purchase Date,Notes',
      '1-a,Update Item 1,,',
      '2-b,Update Item 2,1234,New notes.',
    ];
    const csv = readString(csvLines.join('\n'), { header: true });
    const items = await getItemsFromCsv(csv.data, { db });
    const { processedItems, issuesMap } = await processItems(items, {
      db,
    });
    const { validItems, invalidItems, itemsToCreate, itemsToUpdate } =
      classifyItems(processedItems, {
        itemIssues: issuesMap,
      });
    expect(validItems.length).toBe(2);
    expect(invalidItems.length).toBe(0);
    expect(itemsToCreate.length).toBe(0);
    expect(itemsToUpdate.length).toBe(2);
    expect(itemsToUpdate[0].notes).toBe('');
    expect(itemsToUpdate[1].notes).toBe('New notes.');
    expect(itemsToUpdate[0].purchase_date).toBe(undefined);
    expect(itemsToUpdate[1].purchase_date).toBe(1234);
  });

  it('ignores rows with no name', async () => {
    const csvLines = [
      'ID,Collection Ref. No.,Reference No.,Serial,Name',
      "new-1,'0001,'123456,1,", // new with pre-filled ID
      ",'0002,'123456,2,", // new without ID
      // Existing items
      '1-a,0001,123456,1,',
      "2-b,'0002,'123456,2,",
      // Invalid items
      "new-1,this-is-invalid,'123456,1,",
      ",'0002,'this-is-invalid,2,",
      '1-a,0001,123456,this-is-invalid,',
    ];
    const csv = readString(csvLines.join('\n'), { header: true });
    const items = await getItemsFromCsv(csv.data, { db });
    expect(items.length).toBe(0); // All items without a name will be ignored
  });
});
