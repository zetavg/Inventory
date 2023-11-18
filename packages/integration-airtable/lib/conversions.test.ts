import { DataMeta, DataTypeWithID } from '@deps/data/types';

import {
  collectionToAirtableRecord,
  itemToAirtableRecord,
} from './conversions';

describe('collectionToAirtableRecord', () => {
  it('will only return known fields', async () => {
    const collection: DataTypeWithID<'collection'> = {
      __type: 'collection',
      name: 'A Collection',
      collection_reference_number: '0001',
      config_uuid: '',
    };

    const airtableCollectionsTableFields = {
      Name: {
        type: 'singleLineText',
        id: '-',
        name: 'Name',
      },
      'Ref. No.': {
        type: 'singleLineText',
        id: '-',
        name: 'Ref. No.',
        description: 'Collection Reference Number',
      },
    };

    expect(
      await collectionToAirtableRecord(collection, {
        airtableCollectionsTableFields,
      }),
    ).toStrictEqual({
      fields: {
        Name: 'A Collection',
        'Ref. No.': '0001',
      },
    });
  });

  it('works as expected', async () => {
    const collection: DataTypeWithID<'collection'> = {
      __type: 'collection',
      __id: 'mock-collection-id',
      name: 'A Collection',
      collection_reference_number: '0001',
      config_uuid: '',
    };

    const airtableCollectionsTableFields = {
      Name: {
        type: 'singleLineText',
        id: '-',
        name: 'Name',
      },
      'Ref. No.': {
        type: 'singleLineText',
        id: '-',
        name: 'Ref. No.',
        description: 'Collection Reference Number',
      },
      Delete: {
        type: 'checkbox',
        options: {
          icon: 'xCheckbox',
          color: 'redBright',
        },
        id: '-',
        name: 'Delete',
      },
      'Modified At': {
        type: 'lastModifiedTime',
        options: {
          isValid: true,
          referencedFieldIds: [],
          result: {
            type: 'dateTime',
            options: {
              dateFormat: {
                name: 'iso',
                format: 'YYYY-MM-DD',
              },
              timeFormat: {
                name: '24hour',
                format: 'HH:mm',
              },
              timeZone: 'client',
            },
          },
        },
        id: '-',
        name: 'Modified At',
      },
      ID: {
        type: 'singleLineText',
        id: '-',
        name: 'ID',
      },
      'Synchronization Error Message': {
        type: 'multilineText',
        id: '-',
        name: 'Synchronization Error Message',
      },
    };

    expect(
      await collectionToAirtableRecord(collection, {
        airtableCollectionsTableFields,
      }),
    ).toStrictEqual({
      fields: {
        ID: 'mock-collection-id',
        Name: 'A Collection',
        'Ref. No.': '0001',
      },
    });
  });
});

describe('itemToAirtableRecord', () => {
  it('will only return known fields', async () => {
    const item: DataTypeWithID<'item'> = {
      __type: 'item',
      __id: '1',
      collection_id: '1',
      name: 'A Item',
      config_uuid: '',
    };

    const airtableItemsTableFields = {
      Name: {
        type: 'singleLineText',
        id: '-',
        name: 'Name',
      },
    };

    const getAirtableRecordIdFromCollectionId: (
      collectionId: string,
    ) => Promise<string | undefined> = async () => 'mock-collection-record-id';
    const getAirtableRecordIdFromItemId: (
      itemId: string,
    ) => Promise<string | undefined> = async () => 'mock-item-record-id';

    expect(
      await itemToAirtableRecord(item, {
        airtableItemsTableFields,
        getAirtableRecordIdFromCollectionId,
        getAirtableRecordIdFromItemId,
      }),
    ).toStrictEqual({
      fields: {
        Name: 'A Item',
      },
    });
  });

  it('works as expected', async () => {
    const item: DataTypeWithID<'item'> = {
      __type: 'item',
      __id: '1',
      collection_id: '1',
      name: 'A Item',
      config_uuid: '',
    };

    const airtableItemsTableFields = {
      Name: { type: 'singleLineText', id: '-', name: 'Name' },
      Collection: {
        type: 'multipleRecordLinks',
        options: {
          linkedTableId: '-',
          isReversed: false,
          prefersSingleRecordLink: true,
          inverseLinkFieldId: '-',
        },
        id: '-',
        name: 'Collection',
      },
      Type: {
        type: 'singleSelect',
        options: {
          choices: [],
        },
        id: '-',
        name: 'Type',
      },
      Container: {
        type: 'multipleRecordLinks',
        options: {
          linkedTableId: '-',
          isReversed: false,
          prefersSingleRecordLink: true,
        },
        id: '-',
        name: 'Container',
      },
      Delete: {
        type: 'checkbox',
        options: { icon: 'xCheckbox', color: 'redBright' },
        id: '-',
        name: 'Delete',
      },
      'Created At': {
        type: 'dateTime',
        options: {
          dateFormat: { name: 'iso', format: 'YYYY-MM-DD' },
          timeFormat: { name: '24hour', format: 'HH:mm' },
          timeZone: 'client',
        },
        id: '-',
        name: 'Created At',
      },
      'Modified At': {
        type: 'lastModifiedTime',
        options: {
          isValid: true,
          referencedFieldIds: [],
          result: {
            type: 'dateTime',
            options: {
              dateFormat: { name: 'iso', format: 'YYYY-MM-DD' },
              timeFormat: { name: '24hour', format: 'HH:mm' },
              timeZone: 'client',
            },
          },
        },
        id: '-',
        name: 'Modified At',
      },
      ID: { type: 'singleLineText', id: '-', name: 'ID' },
      'Synchronization Error Message': {
        type: 'multilineText',
        id: '-',
        name: 'Synchronization Error Message',
      },
    };

    const getAirtableRecordIdFromCollectionId: (
      collectionId: string,
    ) => Promise<string | undefined> = async () => 'mock-collection-record-id';
    const getAirtableRecordIdFromItemId: (
      itemId: string,
    ) => Promise<string | undefined> = async () => 'mock-item-record-id';

    expect(
      await itemToAirtableRecord(item, {
        airtableItemsTableFields,
        getAirtableRecordIdFromCollectionId,
        getAirtableRecordIdFromItemId,
      }),
    ).toStrictEqual({
      fields: {
        ID: '1',
        Name: 'A Item',
        Collection: ['mock-collection-record-id'],
        Container: [],
        Type: 'Item',
      },
    });

    item.container_id = 'container-id';

    expect(
      await itemToAirtableRecord(item, {
        airtableItemsTableFields,
        getAirtableRecordIdFromCollectionId,
        getAirtableRecordIdFromItemId,
      }),
    ).toStrictEqual({
      fields: {
        ID: '1',
        Name: 'A Item',
        Collection: ['mock-collection-record-id'],
        Container: ['mock-item-record-id'],
        Type: 'Item',
      },
    });
  });
});
