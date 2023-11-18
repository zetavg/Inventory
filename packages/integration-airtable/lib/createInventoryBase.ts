import AirtableAPI from './AirtableAPI';

// Deprecated because creating lastModifiedTime fields is not supported at this time
export default async function createInventoryBase({
  api,
  name,
  workspaceId,
}: {
  api: AirtableAPI;
  name: string;
  // Find the Workspace ID by clicking on a workspace in https://airtable.com/workspaces and extracting the ID from the URL.
  workspaceId: string;
}) {
  const base = await api.createBase({
    workspaceId,
    name,
    tables: [
      {
        name: 'Items',
        description:
          'Please do not rename fields in this table as it will break the integration.',
        fields: [
          {
            name: 'Name',
            type: 'singleLineText',
          },
          {
            name: 'ID',
            description:
              'A unique ID of the record. Please make sure to clear this field when duplicating a record.',
            type: 'singleLineText',
          },
        ],
      },
      {
        name: 'Collections',
        description:
          'Please do not rename fields in this table as it will break the integration.',
        fields: [
          {
            name: 'Name',
            type: 'singleLineText',
          },
          {
            name: 'ID',
            description:
              'A unique ID of the record. Please make sure to clear this field when duplicating a record.',
            type: 'singleLineText',
          },
          {
            name: 'Ref. Number',
            description: 'Collection reference number.',
            type: 'singleLineText',
          },
        ],
      },
    ],
  });

  if ((base as any).error) {
    throw new Error(JSON.stringify(base, null, 2));
  }

  const collectionsTable = base.tables.find(
    ({ name: n }) => n === 'Collections',
  );
  if (!collectionsTable) {
    throw new Error('collectionsTable not found');
  }

  const itemsTable = base.tables.find(({ name: n }) => n === 'Items');
  if (!itemsTable) {
    throw new Error('itemsTable not found');
  }

  const collectionLastSyncedAtField = await api.createField(
    base.id || '',
    collectionsTable.id || '',
    {
      name: 'Last Synced At',
      type: 'dateTime',
      description:
        'Do not modify this field. It is used by the integration to keep track of the last time the record was synchronized.',
      options: {
        timeZone: 'utc',
        dateFormat: {
          name: 'iso',
        },
        timeFormat: {
          name: '24hour',
        },
      },
    },
  );
  const collectionSyncErrorMessageField = await api.createField(
    base.id || '',
    collectionsTable.id || '',
    {
      name: 'Synchronization Error Message',
      type: 'singleLineText',
      description: 'Do not modify this field.',
    },
  );

  const itemCollectionField = await api.createField(
    base.id || '',
    itemsTable.id || '',
    {
      name: 'Collection',
      type: 'multipleRecordLinks',
      options: {
        linkedTableId: collectionsTable.id || '',
        // Not supported by Airtable API :'(
        // isReversed: false,
        // prefersSingleRecordLink: true,
      },
    },
  );

  const itemDeleteField = await api.createField(
    base.id || '',
    itemsTable.id || '',
    {
      name: 'Delete',
      type: 'checkbox',
      description:
        'Deleting an record on Airtable will not actually delete it in Inventory, and it may be added back on the next sync. To actually delete a record, check this checkbox, and it will be deleted both on Inventory and the Airtable base on the next sync.',
      options: {
        color: 'redBright',
        icon: 'xCheckbox',
      },
    },
  );
  const itemLastSyncedAtField = await api.createField(
    base.id || '',
    itemsTable.id || '',
    {
      name: 'Last Synced At',
      type: 'dateTime',
      description:
        'Do not modify this field. It is used by the integration to keep track of the last time the record was synchronized.',
      options: {
        timeZone: 'utc',
        dateFormat: {
          name: 'iso',
        },
        timeFormat: {
          name: '24hour',
        },
      },
    },
  );
  const itemSyncErrorMessageField = await api.createField(
    base.id || '',
    itemsTable.id || '',
    {
      name: 'Synchronization Error Message',
      type: 'singleLineText',
      description: 'Do not modify this field.',
    },
  );

  return base;
}
