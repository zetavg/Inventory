import {
  DataMeta,
  DataTypeWithID,
  GetAttachmentInfoFromDatum,
  GetData,
  InvalidDataTypeWithID,
  ValidDataTypeWithID,
} from '@deps/data/types';
import { onlyValid } from '@deps/data/utils';

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
    getData,
    getAttachmentInfoFromDatum,
    imagesPublicEndpoint,
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
    getData: GetData;
    getAttachmentInfoFromDatum: GetAttachmentInfoFromDatum;
    imagesPublicEndpoint?: string;
  },
) {
  const collectionRecordId = await getAirtableRecordIdFromCollectionId(
    item.collection_id,
  );
  const containerRecordId =
    item.container_id &&
    (await getAirtableRecordIdFromItemId(item.container_id));
  const imageIds = imagesPublicEndpoint
    ? onlyValid(
        await getData(
          'item_image',
          { item_id: item.__id },
          { sort: [{ order: 'asc' }] },
        ),
      ).map(ii => ii.image_id)
    : [];
  const imageIdAndAttachmentInfo = imagesPublicEndpoint
    ? (
        await Promise.all(
          imageIds.map(
            async id =>
              [
                id,
                await getAttachmentInfoFromDatum(
                  { __type: 'image', __id: id },
                  'image-1440',
                ),
              ] as const,
          ),
        )
      ).filter(
        (ii): ii is [(typeof ii)[0], NonNullable<(typeof ii)[1]>] => !!ii[1],
      )
    : [];
  const fields = {
    Name: item.name,
    ID: item.__id,
    Collection: collectionRecordId ? [collectionRecordId] : [],
    Container: containerRecordId ? [containerRecordId] : [],
    Type: toTitleCase((item.item_type || 'item').replace(/_/gm, ' ')).replace(
      / With /gm,
      ' with ',
    ),
    'Can Contain Items': item._can_contain_items,
    'Ref. No.': item.item_reference_number ? item.item_reference_number : '',
    Serial: typeof item.serial === 'number' ? item.serial : undefined,
    'Individual Asset Ref.': item.individual_asset_reference,
    'Manually Set Individual Asset Ref.':
      item.individual_asset_reference_manually_set,
    Notes: item.notes ? item.notes : '',
    'Model Name': item.model_name ? item.model_name : '',
    PPC: item.purchase_price_currency
      ? item.purchase_price_currency
      : undefined, // Will error 'INVALID_MULTIPLE_CHOICE_OPTIONS - Insufficient permissions to create new select option """"' if given an empty string.
    'Purchase Price':
      typeof item.purchase_price_x1000 === 'number'
        ? item.purchase_price_x1000 / 1000
        : null,
    'Purchased From': item.purchased_from ? item.purchased_from : '',
    'Purchase Date':
      typeof item.purchase_date === 'number'
        ? new Date(item.purchase_date).toISOString()
        : undefined,
    'Expiry Date':
      typeof item.expiry_date === 'number'
        ? new Date(item.expiry_date).toISOString()
        : undefined,
    'Stock Quantity': item.consumable_stock_quantity,
    'Stock Quantity Unit':
      typeof item.consumable_stock_quantity_unit === 'string'
        ? item.consumable_stock_quantity_unit
        : '',
    'Will Not Restock': item.consumable_will_not_restock || false,
    'Icon Name': item.icon_name ? item.icon_name : '',
    'Icon Color': item.icon_color ? item.icon_color : '',
    ...(imagesPublicEndpoint
      ? {
          Images: imageIdAndAttachmentInfo.map(([id, info]) => {
            const filename = `${id}.${(() => {
              switch (info.content_type) {
                case 'image/png':
                  return 'png';
                case 'image/jpeg':
                case 'image/jpg':
                default:
                  return 'jpg';
              }
            })()}`;
            return {
              url: `${imagesPublicEndpoint}/${filename}`,
              filename,
            };
          }),
        }
      : {}),
    'Use First Image as Icon': item.use_first_image_as_icon,
    'RFID EPC Hex': item.rfid_tag_epc_memory_bank_contents,
    'Manually Set RFID EPC Hex':
      item.rfid_tag_epc_memory_bank_contents_manually_set,
    'Updated At': item.__updated_at
      ? new Date(item.__updated_at).toISOString()
      : undefined,
    'Created At': item.__created_at
      ? new Date(item.__created_at).toISOString()
      : undefined,
    // Reset
    'Remove All Images': false,
  };

  const filteredFields = Object.keys(fields)
    .filter(key => key in airtableItemsTableFields)
    .reduce((obj, key: any) => {
      const k: keyof typeof fields = key;
      const val = fields[k];
      // if (typeof val === 'undefined') return obj; // Don't know why this is added at the first place.
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
  {
    integrationId,
    airtableCollectionsTableFields,
    getData,
  }: {
    integrationId: string;
    airtableCollectionsTableFields: {
      [name: string]: unknown;
    };
    getData: GetData;
  },
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

  if (airtableCollectionsTableFields.Name) {
    const value = record.fields.Name;
    collection.name = typeof value === 'string' ? value : undefined;
  }

  if (airtableCollectionsTableFields['Ref. No.']) {
    const value = record.fields['Ref. No.'];
    collection.collection_reference_number =
      typeof value === 'string' ? value : undefined;
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
    airtableItemsTableFields,
    getData,
    recordIdCollectionMap,
    recordIdItemMap,
  }: {
    integrationId: string;
    airtableItemsTableFields: {
      [name: string]: unknown;
    };
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

  if (airtableItemsTableFields.Name) {
    const value = record.fields.Name;
    item.name = typeof value === 'string' ? value : undefined;
  }

  if (airtableItemsTableFields.Collection) {
    const collectionRecordId = Array.isArray(record.fields.Collection)
      ? record.fields.Collection[0]
      : undefined;
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

  if (airtableItemsTableFields.Type) {
    const value = record.fields.Type;
    const itemType = ((typeof value === 'string' ? value : '') || 'item')
      .toLowerCase()
      .replace(/ /gm, '_');
    switch (itemType) {
      case 'item':
        item.item_type = undefined;
        break;
      default:
        item.item_type = itemType;
    }
  }

  if (airtableItemsTableFields.Container) {
    const containerRecordId = Array.isArray(record.fields.Container)
      ? record.fields.Container[0]
      : undefined;
    if (containerRecordId) {
      const itemFromCache = recordIdItemMap.get(containerRecordId);
      if (itemFromCache) {
        item.container_id = itemFromCache.__id;
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

  if (airtableItemsTableFields['Ref. No.']) {
    const value = record.fields['Ref. No.'];
    item.item_reference_number = typeof value === 'string' ? value : undefined;
  }

  if (airtableItemsTableFields.Serial) {
    const value = record.fields.Serial;
    item.serial = typeof value === 'number' ? value : undefined;
  }

  if (airtableItemsTableFields['Individual Asset Ref.']) {
    const value = record.fields['Individual Asset Ref.'];
    item.individual_asset_reference =
      typeof value === 'string' ? value : undefined;
  }

  if (airtableItemsTableFields['Manually Set Individual Asset Ref.']) {
    const value = record.fields['Manually Set Individual Asset Ref.'];
    item.individual_asset_reference_manually_set =
      typeof value === 'boolean' ? value : undefined;
  }

  if (airtableItemsTableFields.Notes) {
    const value = record.fields.Notes;
    item.notes = typeof value === 'string' ? value : undefined;
  }

  if (airtableItemsTableFields['Model Name']) {
    const value = record.fields['Model Name'];
    item.model_name = typeof value === 'string' ? value : undefined;
  }

  if (airtableItemsTableFields.PPC) {
    const value = record.fields.PPC;
    item.purchase_price_currency =
      typeof value === 'string' ? value : undefined;
  }

  if (airtableItemsTableFields['Purchase Price']) {
    const value = record.fields['Purchase Price'];
    item.purchase_price_x1000 =
      typeof value === 'number' ? value * 1000 : undefined;
  }

  if (airtableItemsTableFields['Purchased From']) {
    const value = record.fields['Purchased From'];
    item.purchased_from = typeof value === 'string' ? value : undefined;
  }

  if (airtableItemsTableFields['Purchase Date']) {
    const value = record.fields['Purchase Date'];
    item.purchase_date =
      value && typeof value === 'string'
        ? new Date(value).getTime()
        : undefined;
  }

  if (airtableItemsTableFields['Expiry Date']) {
    const value = record.fields['Expiry Date'];
    item.expiry_date =
      value && typeof value === 'string'
        ? new Date(value).getTime()
        : undefined;
  }

  if (airtableItemsTableFields['Stock Quantity']) {
    const value = record.fields['Stock Quantity'];
    item.consumable_stock_quantity =
      typeof value === 'number'
        ? value
        : item.item_type === 'consumable'
        ? 1
        : undefined;
  }

  if (airtableItemsTableFields['Stock Quantity Unit']) {
    const value = record.fields['Stock Quantity Unit'];
    item.consumable_stock_quantity_unit =
      typeof value === 'string' ? value : undefined;
  }

  if (airtableItemsTableFields['Will Not Restock']) {
    const value = record.fields['Will Not Restock'];
    item.consumable_will_not_restock =
      typeof value === 'boolean' ? value : undefined;
  }

  if (airtableItemsTableFields['Icon Name']) {
    const value = record.fields['Icon Name'];
    item.icon_name = typeof value === 'string' ? value : undefined;
  }

  if (airtableItemsTableFields['Icon Color']) {
    const value = record.fields['Icon Color'];
    item.icon_color = typeof value === 'string' ? value : undefined;
  }

  if (airtableItemsTableFields['Use First Image as Icon']) {
    const value = record.fields['Use First Image as Icon'];
    item.use_first_image_as_icon =
      typeof value === 'boolean' ? value : undefined;
  }

  if (airtableItemsTableFields['RFID EPC Hex']) {
    const value = record.fields['RFID EPC Hex'];
    item.rfid_tag_epc_memory_bank_contents =
      typeof value === 'string' ? value : undefined;
  }

  if (airtableItemsTableFields['Manually Set RFID EPC Hex']) {
    const value = record.fields['Manually Set RFID EPC Hex'];
    item.rfid_tag_epc_memory_bank_contents_manually_set =
      typeof value === 'boolean' ? value : undefined;
  }

  // For convenience, set the collection_id to container's collection_id if it's not set.
  if (!item.collection_id && typeof item.container_id === 'string') {
    const container = (await getData('item', [item.container_id]))[0];
    const containerCollectionId = container?.collection_id;
    if (typeof containerCollectionId === 'string') {
      item.collection_id = containerCollectionId;
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
