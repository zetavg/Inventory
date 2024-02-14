import EPCUtils from '@invt/epc-utils';
import { v4 as uuidv4 } from 'uuid';

import { DEFAULT_EXPIRE_SOON_PRIOR_DAYS } from './consts';
import { DataTypeName } from './schema';
import {
  DataTypeWithID,
  GetAllAttachmentInfoFromDatum,
  GetConfig,
  GetData,
  GetDatum,
  GetRelated,
  InvalidDataTypeWithID,
  SaveDatum,
} from './types';
import { onlyValid } from './utils';

export default function getCallbacks({
  getConfig,
  getDatum,
  getData,
  getRelated,
  getAllAttachmentInfoFromDatum,
  saveDatum,
}: {
  getConfig: GetConfig;
  getDatum: GetDatum;
  getData: GetData;
  getRelated: GetRelated;
  getAllAttachmentInfoFromDatum: GetAllAttachmentInfoFromDatum;
  saveDatum: SaveDatum;
}) {
  return {
    beforeSave: async function beforeSave(
      datum: Partial<
        DataTypeWithID<DataTypeName> | InvalidDataTypeWithID<DataTypeName>
      >,
    ) {
      const config = await getConfig({ ensureSaved: true });
      const isFromSharedDb =
        typeof datum.config_uuid === 'string' &&
        datum.config_uuid !== config.uuid;

      switch (datum.__type) {
        case 'collection': {
          if (!datum.config_uuid) datum.config_uuid = config.uuid;

          if (typeof datum.name === 'string') {
            datum.name = datum.name.trim();
          }

          if (
            !isFromSharedDb &&
            typeof datum.collection_reference_number === 'string' &&
            datum.collection_reference_number
          ) {
            const collectionReferenceDigits =
              EPCUtils.getCollectionReferenceDigits({
                companyPrefix: config.rfid_tag_company_prefix,
                iarPrefix: config.rfid_tag_individual_asset_reference_prefix,
              });

            datum.collection_reference_number =
              datum.collection_reference_number.padStart(
                collectionReferenceDigits,
                '0',
              );
          }

          break;
        }
        case 'item': {
          const collection = await getRelated(
            datum as DataTypeWithID<'item'>,
            'collection',
            {},
          );

          if (collection?.config_uuid) {
            // Might be creating an item for a shared collection.
            datum.config_uuid = collection.config_uuid;
          } else {
            if (!datum.config_uuid) datum.config_uuid = config.uuid;
          }

          if (typeof datum.name === 'string') {
            datum.name = datum.name.trim();
          }
          ['notes', 'model_name', 'purchased_from'].forEach(key => {
            if (typeof datum[key] === 'string') {
              datum[key] = (datum[key] as string).trim();
            }
          });

          if (
            typeof datum.item_type === 'string' &&
            ['container', 'generic_container', 'item_with_parts'].includes(
              datum.item_type,
            )
          ) {
            datum._can_contain_items = true;
          }

          if (datum.item_type === 'consumable') {
            if (typeof datum.consumable_stock_quantity === 'undefined') {
              datum.consumable_stock_quantity = 1;
              datum.consumable_will_not_restock = false;
            }
          } else {
            datum.consumable_stock_quantity = undefined;
            datum.consumable_will_not_restock = undefined;
          }

          // Generate individual_asset_reference
          if (
            !isFromSharedDb &&
            !datum.individual_asset_reference_manually_set
          ) {
            if (
              datum.item_reference_number &&
              typeof datum.item_reference_number === 'string' &&
              (typeof datum.serial === 'number' ||
                typeof datum.serial === 'undefined')
            ) {
              if (collection && collection.__valid) {
                try {
                  datum.individual_asset_reference =
                    EPCUtils.encodeIndividualAssetReference({
                      companyPrefix: config.rfid_tag_company_prefix,
                      iarPrefix:
                        config.rfid_tag_individual_asset_reference_prefix,
                      collectionReference:
                        collection.collection_reference_number,
                      itemReference: datum.item_reference_number,
                      serial: datum.serial || 0,
                    });
                } catch (error) {
                  // We will check if it's valid on validation, so here the error will be simply ignored.
                  datum.individual_asset_reference = undefined;
                }
              } else {
                datum.individual_asset_reference = undefined;
              }
            } else {
              datum.individual_asset_reference = undefined;
            }
          }

          // Generate epc_tag_uri
          if (!isFromSharedDb && !datum.epc_manually_set) {
            if (
              datum.individual_asset_reference &&
              typeof datum.individual_asset_reference === 'string'
            ) {
              if (datum.ignore_iar_prefix) {
                datum.epc_tag_uri = `urn:epc:tag:giai-96:0.${config.rfid_tag_company_prefix}.${datum.individual_asset_reference}`;
              } else {
                datum.epc_tag_uri =
                  EPCUtils.encodeGiaiFromIndividualAssetReference({
                    iarPrefix:
                      config.rfid_tag_individual_asset_reference_prefix,
                    companyPrefix: config.rfid_tag_company_prefix,
                    individualAssetReference: datum.individual_asset_reference,
                  });
              }
            } else {
              datum.epc_tag_uri = undefined;
            }
          }

          // Generate rfid_tag_epc_memory_bank_contents
          if (
            !isFromSharedDb &&
            !datum.rfid_tag_epc_memory_bank_contents_manually_set
          ) {
            if (datum.epc_tag_uri && typeof datum.epc_tag_uri === 'string') {
              try {
                const epcHex = EPCUtils.encodeEpcHexFromGiai(datum.epc_tag_uri);
                datum.rfid_tag_epc_memory_bank_contents = epcHex;
              } catch (e) {
                /* empty */
              }
            } else {
              datum.rfid_tag_epc_memory_bank_contents = undefined;
            }
          }

          if (
            !isFromSharedDb &&
            typeof datum.use_mixed_rfid_tag_access_password !== 'boolean'
          ) {
            datum.use_mixed_rfid_tag_access_password =
              config.default_use_mixed_rfid_tag_access_password;
          }

          if (
            !isFromSharedDb &&
            datum.use_mixed_rfid_tag_access_password &&
            !datum.rfid_tag_access_password
          ) {
            const [generatedHex] = uuidv4().split('-');
            datum.rfid_tag_access_password = generatedHex;
          }

          if (datum.always_show_in_collection) {
            datum._show_in_collection = true;
          } else {
            datum._show_in_collection = true;
            if (datum.container_id) {
              const container = await getRelated(
                datum as DataTypeWithID<'item'>,
                'container',
                {},
              );

              if (container?.collection_id === datum.collection_id) {
                datum._show_in_collection = false;
              }
            }
          }

          if (typeof datum.expiry_date === 'number') {
            if (
              datum.expire_soon_prior_days &&
              typeof datum.expire_soon_prior_days === 'number'
            ) {
              datum._expire_soon_at =
                datum.expiry_date - 86400000 * datum.expire_soon_prior_days;
            } else {
              datum._expire_soon_at =
                datum.expiry_date - 86400000 * DEFAULT_EXPIRE_SOON_PRIOR_DAYS;
            }
          } else {
            datum._expire_soon_at = undefined;
          }

          if (!datum.item_reference_number)
            datum.item_reference_number = undefined;
          if (!datum.serial) datum.serial = undefined;
          if (!datum.epc_tag_uri) datum.epc_tag_uri = undefined;
          if (!datum.rfid_tag_epc_memory_bank_contents)
            datum.rfid_tag_epc_memory_bank_contents = undefined;
          if (!datum.actual_rfid_tag_epc_memory_bank_contents)
            datum.actual_rfid_tag_epc_memory_bank_contents = undefined;
          if (!datum.item_type) datum.item_type = undefined;
          if (!datum.expire_soon_prior_days)
            datum.expire_soon_prior_days = undefined;
          break;
        }
        case 'item_image': {
          if (typeof datum.item_id === 'string') {
            const item = await getDatum('item', datum.item_id);
            if (item) {
              datum._item_collection_id = item.collection_id;
            }
          }
          break;
        }
        case 'image': {
          if (datum.__id) {
            const itemImages = await getData('item_image', {
              image_id: datum.__id,
            });
            datum._item_ids = Array.from(
              new Set(onlyValid(itemImages).map(ii => ii.item_id)),
            );
            datum._item_collection_ids = Array.from(
              new Set(onlyValid(itemImages).map(ii => ii._item_collection_id)),
            );
          }
        }
      }
    },
    afterSave: async function afterSave(
      datum: Partial<
        DataTypeWithID<DataTypeName> | InvalidDataTypeWithID<DataTypeName>
      >,
    ) {
      // const config = await getConfig({ ensureSaved: true });
      // const isFromSharedDb =
      //   typeof datum.config_uuid === 'string' &&
      //   datum.config_uuid !== config.uuid;

      // Create a record for integrations so that they'll know this record has been deleted
      if (datum.__deleted && datum.__type && datum.__id) {
        if (datum.integrations && typeof datum.integrations === 'object') {
          for (const [integrationId, integrationData] of Object.entries(
            datum.integrations,
          )) {
            if (integrationData && typeof integrationData === 'object') {
              const integrationDeletedData: DataTypeWithID<'integration_deleted_data'> =
                {
                  __type: 'integration_deleted_data',
                  __id: `${datum.__type}-${datum.__id}-${integrationId}`, // Prevent creating duplicated data
                  type: datum.__type,
                  id: datum.__id,
                  integration_id: integrationId,
                  data: integrationData,
                };
              await saveDatum(integrationDeletedData, { ignoreConflict: true });
            }
          }
        }
      }

      switch (datum.__type) {
        case 'item': {
          const itemImages = await getData('item_image', {
            item_id: datum.__id,
          });

          for (const ii of itemImages) {
            await saveDatum(
              { ...ii, __deleted: datum.__deleted },
              { skipValidation: true, ignoreConflict: true },
            );
          }

          break;
        }
        case 'item_image': {
          if (
            typeof datum.image_id === 'string' &&
            typeof datum.item_id === 'string'
          ) {
            const image = await getDatum('image', datum.image_id);
            if (image && image.__valid) {
              await saveDatum(image, {
                skipValidation: true,
                ignoreConflict: true,
              });
            }
          }

          break;
        }
        case 'image': {
          if (datum.__deleted) break;

          try {
            const image = await getDatum(datum.__type, datum.__id || '');
            if (!image) throw new Error('Cannot get image');
            const attachments = await getAllAttachmentInfoFromDatum(image);
            const size = Object.values(attachments)
              .map(att => att.size)
              .reduce((a, b) => a + b, 0);
            const image_1440_digest = attachments['image-1440']?.digest;
            if (
              image.size !== size ||
              image.image_1440_digest !== image_1440_digest
            ) {
              await saveDatum([
                image.__type,
                image.__id || '',
                d => ({ ...d, size, image_1440_digest }),
              ]);
            }
          } catch (e) {
            /* empty */
          }
          break;
        }
      }
    },
  };
}
