import { v4 as uuidv4 } from 'uuid';

import appLogger from '@app/logger';

import getData from '@app/data/functions/getData';
import getDatum from '@app/data/functions/getDatum';
import { schema } from '@app/data/schema';
import {
  DataTypeWithAdditionalInfo,
  InvalidDataTypeWithAdditionalInfo,
} from '@app/data/types';

export default async function csvRowToItem(
  csvRow: Record<string, string>,
  {
    db,
    loadedRefNoCollectionsMap,
  }: {
    db: PouchDB.Database;
    loadedRefNoCollectionsMap: Map<
      string,
      DataTypeWithAdditionalInfo<'collection'>
    >;
  },
): Promise<
  DataTypeWithAdditionalInfo<'item'> | InvalidDataTypeWithAdditionalInfo<'item'>
> {
  const logger = appLogger.for({ module: 'csvRowToItem' });
  let collectionRefNumber =
    csvRow['Collection Ref. No.'] ||
    csvRow['Collection Reference No.'] ||
    csvRow['Collection Ref. Number'] ||
    csvRow['Collection Reference Number'];

  if (typeof collectionRefNumber === 'string') {
    collectionRefNumber = collectionRefNumber.replace(/'/g, '');
  }
  if (
    typeof collectionRefNumber === 'string' &&
    !loadedRefNoCollectionsMap.has(collectionRefNumber)
  ) {
    const cs = await getData(
      'collection',
      { collection_reference_number: collectionRefNumber },
      {},
      { db, logger },
    );
    const c = cs[0];
    if (c?.__valid) loadedRefNoCollectionsMap.set(collectionRefNumber, c);
  }
  const collection =
    typeof collectionRefNumber === 'string'
      ? loadedRefNoCollectionsMap.get(collectionRefNumber)
      : undefined;

  let itemReferenceNumber =
    csvRow['Reference No.'] || csvRow['Reference Number'];
  if (typeof itemReferenceNumber === 'string') {
    itemReferenceNumber = itemReferenceNumber.replace(/'/g, '');
  }

  const purchasePrice = csvRow['Purchase Price'];

  const updateData = {
    collection_id:
      typeof collectionRefNumber === 'string'
        ? collection?.__id || null
        : undefined,
    item_reference_number: itemReferenceNumber,
    serial:
      typeof csvRow.Serial === 'string'
        ? csvRow.Serial
          ? parseInt(csvRow.Serial, 10)
          : null
        : undefined,
    name: csvRow.Name,

    // Info
    notes: csvRow.Notes,
    model_name: csvRow['Model Name'],
    purchase_price_x1000:
      typeof purchasePrice === 'string' && purchasePrice
        ? (() => {
            try {
              const [a0, b0] = purchasePrice.split('.');
              const a1 = a0 ? a0 : '0';
              const b1 = b0 ? b0 : '0';
              const b2 = b1.slice(0, 3);
              const b3 = b2.padEnd(3, '0');
              const number = parseInt(a1, 10) * 1000 + parseInt(b3, 10);
              if (isNaN(number)) return undefined;
              return number;
            } catch (e) {
              return undefined;
            }
          })()
        : undefined,
    purchase_price_currency: csvRow['Purchase Price Currency'],
    purchased_from: csvRow['Purchased From'],
    purchase_date:
      typeof csvRow['Purchase Date'] === 'string'
        ? csvRow['Purchase Date']
          ? parseInt(csvRow['Purchase Date'], 10)
          : null
        : undefined,
    expiry_date:
      typeof csvRow['Expiry Date'] === 'string'
        ? csvRow['Expiry Date']
          ? parseInt(csvRow['Expiry Date'], 10)
          : null
        : undefined,

    // Item type and container
    // ...(typeof csvRow['Item Type'] === 'string'
    //   ? {
    //       item_type: csvRow['Item Type'] ? csvRow['Item Type'] : null,
    //     }
    //   : {}),
    item_type:
      typeof csvRow['Item Type'] === 'string'
        ? csvRow['Item Type']
          ? csvRow['Item Type']
          : null
        : undefined,
    container_id: csvRow['Container ID'],

    // Settings
    icon_name: csvRow['Icon Name'],
    icon_color: csvRow['Icon Color'],
    always_show_in_collection:
      typeof csvRow['Always Show in Collection'] === 'string'
        ? csvRow['Always Show in Collection'].toLowerCase() === 'yes' ||
          csvRow['Always Show in Collection'].toLowerCase() === 'true'
        : undefined,

    // Manually set EPC
    ...(csvRow['EPC Tag URI']
      ? {
          epc_tag_uri_manually_set: true,
          epc_tag_uri: csvRow['EPC Tag URI'],
        }
      : {}),
    ...(csvRow['RFID Tag EPC Memory Bank Contents']
      ? {
          rfid_tag_epc_memory_bank_contents_manually_set: true,
          rfid_tag_epc_memory_bank_contents:
            csvRow['RFID Tag EPC Memory Bank Contents'],
        }
      : {}),
  };

  const itemId = csvRow.ID ? csvRow.ID : undefined;
  const oldItem = itemId
    ? await getDatum('item', itemId, { db, logger }).catch(() => null)
    : null;
  const item: Partial<DataTypeWithAdditionalInfo<'item'>> = oldItem
    ? {
        ...oldItem,
        __valid: undefined,
      }
    : {
        __id: itemId || uuidv4(),
      };

  for (const key in updateData) {
    const value: unknown = (updateData as any)[key];
    if (value === null) {
      item[key] = undefined;
    } else if (value !== undefined) {
      item[key] = value;
    }
  }

  if (!item.icon_name) {
    item.icon_name = 'cube-outline';
  }

  if (!item.icon_color) {
    item.icon_color = 'grey';
  }

  try {
    const parsedItem = schema.item.parse(item);

    return {
      ...parsedItem,
      __type: 'item',
      __valid: true,
      __raw: { csvRow, oldItem },
    };
  } catch (e) {
    return {
      ...item,
      __type: 'item',
      __valid: false,
      __error_details: e,
      __raw: { csvRow, oldItem },
    };
  }
}
