import appLogger from '@app/logger';

import EPCUtils from '@app/modules/EPCUtils';

import { getConfig } from './functions/config';
import getRelated from './functions/getRelated';
import { DataTypeName } from './schema';
import {
  DataTypeWithAdditionalInfo,
  InvalidDataTypeWithAdditionalInfo,
} from './types';

const logger = appLogger.for({ module: 'data/beforeSave' });

export async function beforeSave(
  datum:
    | DataTypeWithAdditionalInfo<DataTypeName>
    | InvalidDataTypeWithAdditionalInfo<DataTypeName>,
  { db }: { db: PouchDB.Database },
) {
  switch (datum.__type) {
    case 'item': {
      if (
        datum.item_reference_number &&
        typeof datum.item_reference_number === 'string' &&
        (typeof datum.serial === 'string' ||
          typeof datum.serial === 'undefined')
      ) {
        const config = await getConfig({ db });
        const collection = await getRelated(
          datum as DataTypeWithAdditionalInfo<'item'>,
          'collection',
          {
            db,
            logger,
          },
        );
        if (collection && collection.__valid) {
          const collectionRefNumber = collection.collection_reference_number;
          try {
            datum._individual_asset_reference =
              EPCUtils.encodeIndividualAssetReference(
                parseInt(config.rfid_tag_prefix, 10),
                collectionRefNumber,
                datum.item_reference_number,
                parseInt(datum.serial || '0', 10),
                { joinBy: '.', includePrefix: true },
              );
          } catch (error) {
            // We will check if it's valid on validation, so here the error will be simply logged and ignored.
            logger.warn(error);
            datum._individual_asset_reference = undefined;
          }
        } else {
          datum._individual_asset_reference = undefined;
        }
      } else {
        datum._individual_asset_reference = undefined;
      }

      if (!datum.epc_manually_set) {
        if (
          datum._individual_asset_reference &&
          typeof datum._individual_asset_reference === 'string'
        ) {
          const iar = datum._individual_asset_reference.replace(/\./g, '');
          const config = await getConfig({ db });
          datum.epc_tag_uri = EPCUtils.encodeGIAI('uri', {
            companyPrefix: config.rfid_tag_company_prefix,
            assetReference: iar,
          });
        } else {
          datum.epc_tag_uri = undefined;
        }
      }

      if (!datum.rfid_tag_epc_memory_bank_contents_manually_set) {
        if (datum.epc_tag_uri && typeof datum.epc_tag_uri === 'string') {
          try {
            const [epcHex] = EPCUtils.encodeHexEPC(datum.epc_tag_uri);
            datum.rfid_tag_epc_memory_bank_contents = epcHex;
          } catch (e) {}
        } else {
          datum.rfid_tag_epc_memory_bank_contents = undefined;
        }
      }

      if (!datum.item_reference_number) datum.item_reference_number = undefined;
      if (!datum.serial) datum.serial = undefined;
      if (!datum.epc_tag_uri) datum.epc_tag_uri = undefined;
      if (!datum.rfid_tag_epc_memory_bank_contents)
        datum.rfid_tag_epc_memory_bank_contents = undefined;
      if (!datum.actual_rfid_tag_epc_memory_bank_contents)
        datum.actual_rfid_tag_epc_memory_bank_contents = undefined;
      if (!datum.item_type) datum.item_type = undefined;
      break;
    }
  }
}
