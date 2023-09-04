import appLogger from '@app/logger';

import { DataTypeWithAdditionalInfo } from '@app/data';
import getDatum from '@app/data/functions/getDatum';

export default async function itemToCsvRow(
  item: DataTypeWithAdditionalInfo<'item'>,
  {
    db,
    loadedCollectionsMap,
  }: {
    db: PouchDB.Database;
    loadedCollectionsMap: Map<string, DataTypeWithAdditionalInfo<'collection'>>;
  },
) {
  const logger = appLogger.for({ module: 'itemToCsvRow' });
  if (!loadedCollectionsMap.has(item.collection_id)) {
    const c = await getDatum('collection', item.collection_id, { db, logger });
    if (c?.__valid) loadedCollectionsMap.set(item.collection_id, c);
  }
  const collection = loadedCollectionsMap.get(item.collection_id);

  return {
    ID: item.__id,
    'Collection Ref. No.': collection?.collection_reference_number
      ? `'${collection?.collection_reference_number}`
      : '',
    'Reference No.': item.item_reference_number
      ? `'${item.item_reference_number}`
      : '',
    Serial: item.serial,
    Name: item.name,

    // Info
    Notes: item.notes,
    'Model Name': item.model_name,
    'Purchase Price':
      typeof item.purchase_price_x1000 === 'number'
        ? (() => {
            const str = item.purchase_price_x1000.toString();
            const a = str.slice(0, -3) || '0';
            const b = str.slice(-3).padStart(3, '0').replace(/0+$/, '');
            if (!b) {
              return a;
            }
            return a + '.' + b;
          })()
        : '',
    'Purchase Price Currency': item.purchase_price_currency,
    'Purchased From': item.purchased_from,
    'Purchase Date': item.purchase_date,
    'Expiry Date': item.expiry_date,

    // Item type and container
    'Item Type': item.item_type,
    'Container ID': item.container_id,

    // Settings
    'Icon Name': item.icon_name,
    'Icon Color': item.icon_color,
    'Always Show in Collection': item.always_show_in_collection,

    // Manually set EPC
    'EPC Tag URI': item.epc_tag_uri_manually_set ? item.epc_tag_uri : '',
    'RFID Tag EPC Memory Bank Contents':
      item.rfid_tag_epc_memory_bank_contents_manually_set
        ? item.rfid_tag_epc_memory_bank_contents
        : '',
  };
}
