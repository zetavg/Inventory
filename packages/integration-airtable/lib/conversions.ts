import {
  DataMeta,
  DataTypeWithID,
  GetData,
  InvalidDataTypeWithID,
  ValidDataTypeWithID,
} from '@deps/data/types';

export async function collectionToAirtableRecord(
  collection: DataTypeWithID<'collection'>,
  {
    airtableCollectionsTableFields,
  }: {
    airtableCollectionsTableFields: {
      [name: string]: unknown;
    };
  },
) {
  const fields = {
    Name: collection.name,
    ID: collection.__id,
    'Ref. No.': collection.collection_reference_number,
  };

  const filteredFields = Object.keys(fields)
    .filter(key => key in airtableCollectionsTableFields)
    .reduce((obj, key: any) => {
      const k: keyof typeof fields = key;
      obj[k] = fields[k];
      return obj;
    }, {} as Partial<typeof fields>);

  const record = {
    fields: filteredFields,
  };

  return record;
}

export async function itemToAirtableRecord(
  item: DataTypeWithID<'item'>,
  {
    airtableItemsTableFields,
    getAirtableRecordIdFromCollectionId,
    getAirtableRecordIdFromItemId,
  }: {
    airtableItemsTableFields: {
      [name: string]: unknown;
    };
    getAirtableRecordIdFromCollectionId: (
      collectionId: string,
    ) => Promise<string | undefined>;
    getAirtableRecordIdFromItemId: (
      itemId: string,
    ) => Promise<string | undefined>;
  },
) {
  const collectionRecordId = await getAirtableRecordIdFromCollectionId(
    item.collection_id,
  );
  const containerRecordId =
    item.container_id &&
    (await getAirtableRecordIdFromItemId(item.container_id));
  const fields = {
    Name: item.name,
    ID: item.__id,
    Collection: collectionRecordId ? [collectionRecordId] : [],
    Container: containerRecordId ? [containerRecordId] : [],
    Type: toTitleCase((item.item_type || 'item').replace(/_/gm, ' ')).replace(
      / With /gm,
      ' with ',
    ),
    'Updated At': item.__updated_at
      ? new Date(item.__updated_at).toISOString()
      : undefined,
    'Created At': item.__created_at
      ? new Date(item.__created_at).toISOString()
      : undefined,
  };

  const filteredFields = Object.keys(fields)
    .filter(key => key in airtableItemsTableFields)
    .reduce((obj, key: any) => {
      const k: keyof typeof fields = key;
      const val = fields[k];
      if (!val) return obj;
      obj[k] = val as any;
      return obj;
    }, {} as Partial<typeof fields>);

  const record = {
    fields: filteredFields,
  };

  return record;
}

export async function airtableRecordToCollection(
  record: {
    id: string;
    fields: { [name: string]: unknown };
  },
  { integrationId, getData }: { integrationId: string; getData: GetData },
) {
  const existingCollections = await getData('collection', {
    integrations: { [integrationId]: { id: record.id } },
  });
  const existingCollectionId = existingCollections[0]?.__id;
  const collection:
    | ValidDataTypeWithID<'collection'>
    | InvalidDataTypeWithID<'collection'> = existingCollectionId
    ? existingCollections[0]
    : {
        __type: 'collection',
        __valid: false,
      };

  if (typeof record.fields.Delete === 'boolean') {
    collection.__deleted = record.fields.Delete;
  }
  if (typeof record.fields.Name === 'string') {
    collection.name = record.fields.Name;
  }
  if (typeof record.fields['Ref. No.'] === 'string') {
    collection.collection_reference_number = record.fields['Ref. No.'];
  }

  if (!collection.integrations || typeof collection.integrations !== 'object') {
    collection.integrations = {};
  }
  if (
    !(collection.integrations as any)[integrationId] ||
    typeof (collection.integrations as any)[integrationId] !== 'object'
  ) {
    (collection.integrations as any)[integrationId] = {};
  }

  (collection.integrations as any)[integrationId].id = record.id;

  const recordModifiedAt =
    typeof record.fields['Modified At'] === 'string'
      ? new Date(record.fields['Modified At']).getTime()
      : null;
  if (recordModifiedAt) {
    (collection.integrations as any)[integrationId].modified_at =
      recordModifiedAt;
  }

  return collection;
}

export async function airtableRecordToItem(
  record: {
    id: string;
    fields: { [name: string]: unknown };
  },
  {
    integrationId,
    getData,
    recordIdCollectionMap,
    recordIdItemMap,
  }: {
    integrationId: string;
    getData: GetData;
    recordIdCollectionMap: Map<string, DataMeta<'collection'>>;
    recordIdItemMap: Map<string, DataMeta<'item'>>;
  },
) {
  const existingItems = await getData('item', {
    integrations: { [integrationId]: { id: record.id } },
  });
  const existingItemId = existingItems[0]?.__id;
  const item: ValidDataTypeWithID<'item'> | InvalidDataTypeWithID<'item'> =
    existingItemId
      ? existingItems[0]
      : {
          __type: 'item',
          __valid: false,
        };

  if (typeof record.fields.Delete === 'boolean') {
    item.__deleted = record.fields.Delete;
  }
  if (typeof record.fields.Name === 'string') {
    item.name = record.fields.Name;
  }

  if (Array.isArray(record.fields.Collection)) {
    const collectionRecordId = record.fields.Collection[0];
    if (collectionRecordId) {
      const collectionFromCache = recordIdCollectionMap.get(collectionRecordId);
      if (collectionFromCache) {
        item.collection_id = collectionFromCache.__id;
      } else {
        const collections = await getData('collection', {
          integrations: { [integrationId]: { id: collectionRecordId } },
        });
        if (collections[0]) {
          recordIdCollectionMap.set(collectionRecordId, collections[0]);
        }
        item.collection_id = collections[0]?.__id;
      }
    } else {
      item.collection_id = undefined;
    }
  }

  if (typeof record.fields.Type === 'string') {
    const itemType = record.fields.Type.toLowerCase().replace(/ /gm, '_');
    switch (itemType) {
      case 'item':
        item.item_type = undefined;
        break;
      default:
        item.item_type = itemType;
    }
  }

  if (Array.isArray(record.fields.Container)) {
    const containerRecordId = record.fields.Container[0];
    if (containerRecordId) {
      const itemFromCache = recordIdItemMap.get(containerRecordId);
      if (itemFromCache) {
        item.item_id = itemFromCache.__id;
      } else {
        const items = await getData('item', {
          integrations: { [integrationId]: { id: containerRecordId } },
        });
        if (items[0]) {
          recordIdItemMap.set(containerRecordId, items[0]);
        }
        item.container_id = items[0]?.__id;
      }
    } else {
      item.container_id = undefined;
    }
  }

  if (!item.integrations || typeof item.integrations !== 'object') {
    item.integrations = {};
  }
  if (
    !(item.integrations as any)[integrationId] ||
    typeof (item.integrations as any)[integrationId] !== 'object'
  ) {
    (item.integrations as any)[integrationId] = {};
  }

  (item.integrations as any)[integrationId].id = record.id;

  const recordModifiedAt =
    typeof record.fields['Modified At'] === 'string'
      ? new Date(record.fields['Modified At']).getTime()
      : null;
  if (recordModifiedAt) {
    (item.integrations as any)[integrationId].modified_at = recordModifiedAt;
  }

  return item;
}

function toTitleCase(str: string) {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.substring(1))
    .join(' ');
}
