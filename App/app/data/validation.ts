import { ZodIssue } from 'zod';

import appLogger from '@app/logger';

import EPCUtils from '@app/modules/EPCUtils';

import { getConfig } from './functions/config';
import getData from './functions/getData';
import getDatum from './functions/getDatum';
import getRelated from './functions/getRelated';
import { getDataIdFromPouchDbId, getDataTypeSelector } from './pouchdb-utils';
import { DataTypeName } from './schema';
import {
  DataTypeWithAdditionalInfo,
  InvalidDataTypeWithAdditionalInfo,
} from './types';

const logger = appLogger.for({ module: 'data/validation' });

export async function validate(
  datum:
    | DataTypeWithAdditionalInfo<DataTypeName>
    | InvalidDataTypeWithAdditionalInfo<DataTypeName>,
  { db }: { db: PouchDB.Database },
): Promise<Array<ZodIssue>> {
  const issues: Array<ZodIssue> = [];

  switch (datum.__type) {
    case 'collection': {
      if (
        datum.collection_reference_number &&
        typeof datum.collection_reference_number === 'string'
      ) {
        const config = await getConfig({ db });
        const collectionReferenceDigitsLimit =
          EPCUtils.getCollectionReferenceDigitsLimit({
            companyPrefixDigits: config.rfid_tag_company_prefix.length,
            tagPrefixDigits: config.rfid_tag_prefix.length,
          });

        if (
          typeof datum.collection_reference_number === 'string' &&
          datum.collection_reference_number.length >
            collectionReferenceDigitsLimit
        ) {
          issues.push({
            code: 'custom',
            path: ['collection_reference_number'],
            message: `Is too long (max. ${collectionReferenceDigitsLimit} digits)`,
          });
        }

        // if (
        //   typeof d.collection_reference_number === 'string' &&
        //   d.collection_reference_number.length < collectionReferenceDigitsLimit
        // ) {
        //   issues.push({
        //     code: 'custom',
        //     path: ['collection_reference_number'],
        //     message: `Is too short (min. ${collectionReferenceDigitsLimit} digits)`,
        //   });
        // }

        const dataWithSameCrn = await getData(
          'collection',
          {
            collection_reference_number: datum.collection_reference_number,
          },
          {},
          { db, logger },
        );

        if (dataWithSameCrn.some(d => d.__id !== datum.__id)) {
          const dWithSameCrn = dataWithSameCrn.find(
            dd => dd.__id !== datum.__id,
          );
          issues.push({
            code: 'custom',
            path: ['collection_reference_number'],
            message: `Must be unique (reference number ${
              datum.collection_reference_number
            } is already taken by collection "${
              typeof dWithSameCrn?.name === 'string'
                ? dWithSameCrn.name
                : dWithSameCrn?.__id
            }")`,
          });
        }
      }
      break;
    }

    case 'item': {
      let collection;
      if (datum.collection_id && typeof datum.collection_id === 'string') {
        collection = await getDatum('collection', datum.collection_id, {
          db,
          logger,
        });
        if (!collection) {
          issues.push({
            code: 'custom',
            path: ['collection_id'],
            message: `Can't find collection with ID "${datum.collection_id}"`,
          });
        }
      }

      const contents = await getRelated(
        datum as DataTypeWithAdditionalInfo<'item'>,
        'contents',
        {},
        {
          db,
          logger,
        },
      );
      if (contents && contents.length > 0) {
        if (
          !['container', 'generic_container', 'item_with_parts'].includes(
            (datum as DataTypeWithAdditionalInfo<'item'>).item_type || '',
          )
        ) {
          issues.push({
            code: 'custom',
            path: ['item_type'],
            message: `This item already contains items, cannot set item type to ${
              (datum as DataTypeWithAdditionalInfo<'item'>).item_type || 'item'
            }`,
          });
        }
      }

      let hasIARError = false;
      if (
        datum._individual_asset_reference &&
        typeof datum._individual_asset_reference === 'string'
      ) {
        const itemsWithSameIAR = await getData(
          'item',
          {
            _individual_asset_reference: datum._individual_asset_reference,
          },
          {},
          { db, logger },
        );
        const differentItemsWithSameIAR = itemsWithSameIAR.filter(
          i => i.__id !== datum.__id,
        );
        if (differentItemsWithSameIAR.length > 0) {
          hasIARError = true;
          const i = differentItemsWithSameIAR[0];
          issues.push({
            code: 'custom',
            path: ['item_reference_number'],
            message: `Individual Asset Reference should be unique, but "${
              datum._individual_asset_reference
            }" is already used by item ${
              typeof i.name === 'string'
                ? `"${i.name}" (ID: ${i.__id})`
                : i.__id
            }`,
          });
        }
      }

      if (
        datum.item_reference_number &&
        datum.item_reference_number === 'string' &&
        (typeof datum.serial === 'string' ||
          typeof datum.serial === 'undefined') &&
        typeof collection?.collection_reference_number === 'string'
      ) {
        const config = await getConfig({ db });
        if (collection) {
          try {
            EPCUtils.encodeIndividualAssetReference(
              parseInt(config.rfid_tag_prefix, 10),
              collection.collection_reference_number,
              datum.item_reference_number,
              parseInt(datum.serial || '0', 10),
              { companyPrefix: config.rfid_tag_company_prefix },
            );
          } catch (e) {
            issues.push({
              code: 'custom',
              path: ['item_reference_number'],
              message: e instanceof Error ? e.message : JSON.stringify(e),
            });
          }
        }
      }

      if (datum.epc_tag_uri && typeof datum.epc_tag_uri === 'string') {
        try {
          EPCUtils.encodeHexEPC(datum.epc_tag_uri);
        } catch (e) {
          issues.push({
            code: 'custom',
            path: ['epc_tag_uri'],
            message: e instanceof Error ? e.message : JSON.stringify(e),
          });
        }
      }

      if (
        datum.rfid_tag_epc_memory_bank_contents &&
        typeof datum.rfid_tag_epc_memory_bank_contents === 'string' &&
        !hasIARError
      ) {
        try {
          // TODO: verify that rfid_tag_epc_memory_bank_contents is a valid hex
        } catch (e) {
          issues.push({
            code: 'custom',
            path: ['rfid_tag_epc_memory_bank_contents'],
            message: e instanceof Error ? e.message : JSON.stringify(e),
          });
        }

        const itemsWithSameRfidTagEpc = await getData(
          'item',
          {
            rfid_tag_epc_memory_bank_contents:
              datum.rfid_tag_epc_memory_bank_contents,
          },
          {},
          { db, logger },
        );
        const differentItemsWithSameRfidTagEpc = itemsWithSameRfidTagEpc.filter(
          i => i.__id !== datum.__id,
        );
        if (differentItemsWithSameRfidTagEpc.length > 0) {
          const i = differentItemsWithSameRfidTagEpc[0];
          issues.push({
            code: 'custom',
            path: ['rfid_tag_epc_memory_bank_contents'],
            message: `RFID tag EPC memory bank contents should be unique, but "${
              datum.rfid_tag_epc_memory_bank_contents
            }" is already used by item ${
              typeof i.name === 'string'
                ? `"${i.name}" (ID: ${i.__id})`
                : i.__id
            }`,
          });
        }

        const itemsWithMatchedActualRfidTagEpc = await getData(
          'item',
          {
            actual_rfid_tag_epc_memory_bank_contents:
              datum.rfid_tag_epc_memory_bank_contents,
          },
          {},
          { db, logger },
        );
        const differentItemsWithMatchedActualRfidTagEpc =
          itemsWithMatchedActualRfidTagEpc.filter(i => i.__id !== datum.__id);
        if (differentItemsWithMatchedActualRfidTagEpc.length > 0) {
          const i = differentItemsWithMatchedActualRfidTagEpc[0];
          issues.push({
            code: 'custom',
            path: ['rfid_tag_epc_memory_bank_contents'],
            message: `RFID tag EPC memory bank contents should be unique, but "${
              datum.rfid_tag_epc_memory_bank_contents
            }" is already used by item ${
              typeof i.name === 'string'
                ? `"${i.name}" (ID: ${i.__id})`
                : i.__id
            } as the actual RFID EPC memory bank contents`,
          });
        }
      }
      break;
    }
  }

  return issues;
}

export async function validateDelete(
  d: { __type: DataTypeName; __id: string | undefined; __deleted: boolean },
  { db }: { db: PouchDB.Database },
): Promise<Array<ZodIssue>> {
  const issues: Array<ZodIssue> = [];

  switch (d.__type) {
    case 'collection': {
      const collection = await getDatum('collection', d.__id || '', {
        db,
        logger,
      });
      if (collection) {
        const items = await getRelated(
          collection,
          'items',
          {},
          {
            db,
            logger,
          },
        );

        if (!items) {
          issues.push({
            code: 'custom',
            path: [],
            message: 'Cannot check if this collection has no items.',
          });
        } else if (items.length > 0) {
          issues.push({
            code: 'custom',
            path: [],
            message: 'Cannot delete a collection that contain items.',
          });
        }
      }
      break;
    }

    case 'item': {
      const item = await getDatum('item', d.__id || '', {
        db,
        logger,
      });
      if (item) {
        const items = await getRelated(
          item,
          'contents',
          {},
          {
            db,
            logger,
          },
        );

        if (!items) {
          issues.push({
            code: 'custom',
            path: [],
            message: 'Cannot check if this item has no contents.',
          });
        } else if (items.length > 0) {
          issues.push({
            code: 'custom',
            path: [],
            message: 'Cannot delete a item that contain items.',
          });
        }
      }
      break;
    }
  }

  return issues;
}
