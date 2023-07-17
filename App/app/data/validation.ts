import { ZodIssue } from 'zod';

import appLogger from '@app/logger';

import EPCUtils from '@app/modules/EPCUtils';

import { getConfig } from './functions/config';
import getDatum from './functions/getDatum';
import getRelated from './functions/getRelated';
import {
  getDataIdFromPouchDbId,
  getDataTypeSelector,
  getPouchDbId,
} from './pouchdb-utils';
import { DataTypeName } from './schema';
import { DataTypeWithAdditionalInfo } from './types';

const logger = appLogger.for({ module: 'data/validation' });

export async function validate(
  d: DataTypeWithAdditionalInfo<DataTypeName>,
  { db }: { db: PouchDB.Database },
): Promise<Array<ZodIssue>> {
  const issues: Array<ZodIssue> = [];

  switch (d.__type) {
    case 'collection': {
      if (d.collection_reference_number) {
        const config = await getConfig({ db });
        const collectionReferenceDigitsLimit =
          EPCUtils.getCollectionReferenceDigitsLimit({
            companyPrefixDigits: config.rfid_tag_company_prefix.length,
            tagPrefixDigits: config.rfid_tag_prefix.length,
          });

        if (
          typeof d.collection_reference_number === 'string' &&
          d.collection_reference_number.length > collectionReferenceDigitsLimit
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

        // TODO: refactor this to use util function instead of accessing the database directly
        await db.createIndex({
          index: {
            fields: ['data.collection_reference_number'],
            partial_filter_selector: getDataTypeSelector('collection'),
          },
        });
        const response = await db.find({
          selector: {
            'data.collection_reference_number': d.collection_reference_number,
          },
          fields: ['_id', 'data.name'],
        });
        if (
          response.docs.some(
            doc => getDataIdFromPouchDbId(doc._id).id !== d.__id,
          )
        ) {
          const doc = response.docs.find(
            dd => getDataIdFromPouchDbId(dd._id).id !== d.__id,
          );
          issues.push({
            code: 'custom',
            path: ['collection_reference_number'],
            message: `Must be unique (reference number ${
              d.collection_reference_number
            } is already taken by collection "${(doc as any)?.data?.name}")`,
          });
        }
      }
      break;
    }

    case 'item': {
      const data = d as DataTypeWithAdditionalInfo<'item'>;
      let collection;
      if (data.collection_id) {
        const result = await getDatum('collection', data.collection_id, {
          db,
          logger,
          validate: false,
        });
        collection = result.datum;
        if (!collection) {
          issues.push({
            code: 'custom',
            path: ['collection_id'],
            message: `Can't find collection with ID "${data.collection_id}"`,
          });
        }
      }

      if (data.item_reference_number) {
        const config = await getConfig({ db });
        if (collection) {
          try {
            EPCUtils.encodeIndividualAssetReference(
              parseInt(config.rfid_tag_prefix, 10),
              collection.collection_reference_number,
              data.item_reference_number,
              parseInt(data.serial || '0', 10),
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

      if (data.epc_tag_uri) {
        try {
          EPCUtils.encodeHexEPC(data.epc_tag_uri);
        } catch (e) {
          issues.push({
            code: 'custom',
            path: ['epc_tag_uri'],
            message: e instanceof Error ? e.message : JSON.stringify(e),
          });
        }
      }

      if (data.rfid_tag_epc_memory_bank_contents) {
        try {
          // TODO: verify that rfid_tag_epc_memory_bank_contents is a valid hex
        } catch (e) {
          issues.push({
            code: 'custom',
            path: ['rfid_tag_epc_memory_bank_contents'],
            message: e instanceof Error ? e.message : JSON.stringify(e),
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
      const { datum: collection } = await getDatum('collection', d.__id || '', {
        db,
        logger,
        validate: false,
      });
      if (collection) {
        const items = await getRelated(collection, 'items', {
          db,
          logger,
          validate: false,
        });

        if (items.length > 0) {
          issues.push({
            code: 'custom',
            path: [],
            message: 'Cannot delete a collection that contain items.',
          });
        }
      }
      break;
    }
  }

  return issues;
}
