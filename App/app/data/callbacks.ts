import appLogger from '@app/logger';

import EPCUtils from '@app/modules/EPCUtils';

import { getConfig } from './functions/config';
import getRelated from './functions/getRelated';
import { DataTypeName } from './schema';
import { DataTypeWithAdditionalInfo } from './types';

const logger = appLogger.for({ module: 'data/beforeSave' });

export async function beforeSave(
  d: DataTypeWithAdditionalInfo<DataTypeName>,
  { db }: { db: PouchDB.Database },
) {
  switch (d.__type) {
    case 'item': {
      const data = d as DataTypeWithAdditionalInfo<'item'>;

      if (data.item_reference_number) {
        const config = await getConfig({ db });
        const collection = await getRelated(data, 'collection', {
          db,
          logger,
        });
        if (collection) {
          const collectionRefNumber = collection.collection_reference_number;
          try {
            data._individual_asset_reference =
              EPCUtils.encodeIndividualAssetReference(
                parseInt(config.rfid_tag_prefix, 10),
                collectionRefNumber,
                data.item_reference_number,
                parseInt(data.serial || '0', 10),
                { joinBy: '.', includePrefix: true },
              );
          } catch (error) {
            // We will check if it's valid on validation, so here the error will be simply logged and ignored.
            logger.warn(error);
            data._individual_asset_reference = undefined;
          }
        } else {
          data._individual_asset_reference = undefined;
        }
      } else {
        data._individual_asset_reference = undefined;
      }

      if (!data.epc_manually_set) {
        if (data._individual_asset_reference) {
          const iar = data._individual_asset_reference.replace(/\./g, '');
          const config = await getConfig({ db });
          data.epc_tag_uri = EPCUtils.encodeGIAI('uri', {
            companyPrefix: config.rfid_tag_company_prefix,
            assetReference: iar,
          });
        } else {
          data.epc_tag_uri = undefined;
        }
      }

      if (!data.rfid_tag_epc_memory_bank_contents_manually_set) {
        if (data.epc_tag_uri) {
          try {
            const [epcHex] = EPCUtils.encodeHexEPC(data.epc_tag_uri);
            data.rfid_tag_epc_memory_bank_contents = epcHex;
          } catch (e) {}
        } else {
          data.rfid_tag_epc_memory_bank_contents = undefined;
        }
      }

      if (!data.item_reference_number) data.item_reference_number = undefined;
      if (!data.serial) data.serial = undefined;
      if (!data.epc_tag_uri) data.epc_tag_uri = undefined;
      if (!data.rfid_tag_epc_memory_bank_contents)
        data.rfid_tag_epc_memory_bank_contents = undefined;
      if (!data.actual_rfid_tag_epc_memory_bank_contents)
        data.actual_rfid_tag_epc_memory_bank_contents = undefined;
      if (!data.item_type) data.item_type = undefined;
      break;
    }
  }
}
