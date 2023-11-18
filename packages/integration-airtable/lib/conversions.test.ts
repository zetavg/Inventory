import { DataTypeWithID } from '@deps/data/types';

import {
  collectionToAirtableRecord,
  itemToAirtableRecord,
} from './conversions';

describe('collectionToAirtableRecord', () => {
  it('works as expected', async () => {
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
      'Ref. Number': {
        type: 'singleLineText',
        id: '-',
        name: 'Ref. Number',
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
        'Ref. Number': '0001',
      },
    });
  });
});

describe('itemToAirtableRecord', () => {
  // it('works as expected', async () => {
  //   const collection: DataTypeWithID<'collection'> = {
  //     __type: 'collection',
  //     __id: '1',
  //     name: 'A Collection',
  //     collection_reference_number: '0001',
  //     config_uuid: '',
  //   };

  //   const item: DataTypeWithID<'item'> = {
  //     __type: 'item',
  //     __id: '1',
  //     collection_id: '1',
  //     name: 'A Item',
  //     config_uuid: '',
  //   };

  //   const airtableItemsTableFields = {
  //     Name: {
  //       type: 'singleLineText',
  //       id: '-',
  //       name: 'Name',
  //     },
  //   };

  //   const getAirtableRecordIdFromCollectionId: (
  //     collectionId: string,
  //   ) => Promise<string | undefined> = async () => 'mock-collection-record-id';

  //   expect(
  //     await itemToAirtableRecord(item, {
  //       airtableItemsTableFields,
  //       getAirtableRecordIdFromCollectionId,
  //     }),
  //   ).toStrictEqual({
  //     fields: {
  //       Name: 'A Item',
  //     },
  //   });
  // });
});
