import { v4 as uuidv4 } from 'uuid';

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
    case 'collection': {
      const config = await getConfig({ db });

      if (typeof datum.name === 'string') {
        datum.name = datum.name.trim();
      }

      if (
        typeof datum.collection_reference_number === 'string' &&
        datum.collection_reference_number
      ) {
        const collectionReferenceDigitsLimit =
          EPCUtils.getCollectionReferenceDigitsLimit({
            companyPrefixDigits: config.rfid_tag_company_prefix.length,
            tagPrefixDigits: config.rfid_tag_prefix.length,
          });

        datum.collection_reference_number =
          datum.collection_reference_number.padStart(
            collectionReferenceDigitsLimit,
            '0',
          );
      }

      break;
    }
    case 'item': {
      if (typeof datum.name === 'string') {
        datum.name = datum.name.trim();
      }

      if (
        typeof datum.item_type === 'string' &&
        ['container', 'generic_container', 'item_with_parts'].includes(
          datum.item_type,
        )
      ) {
        datum._can_contain_items = true;
      }
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
          {},
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

      if (!datum.rfid_tag_access_password) {
        const [generatedHex] = uuidv4().split('-');
        datum.rfid_tag_access_password = generatedHex;
      }

      if (datum.always_show_in_collection) {
        datum._show_in_collection = true;
      } else {
        datum._show_in_collection = true;
        if (datum.container_id) {
          const container = await getRelated(
            datum as DataTypeWithAdditionalInfo<'item'>,
            'container',
            {},
            {
              db,
              logger,
            },
          );

          if (container?.collection_id === datum.collection_id) {
            datum._show_in_collection = false;
          }
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