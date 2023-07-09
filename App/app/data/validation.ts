import { ZodIssue } from 'zod';

import EPCUtils from '@app/modules/EPCUtils';

import {
  getDataIdFromPouchDbId,
  getDataTypeSelector,
  getPouchDbId,
} from './pouchdb-utils';
import { DataTypeName } from './schema';
import { DataTypeWithAdditionalInfo } from './types';

export async function validate(
  d: DataTypeWithAdditionalInfo<DataTypeName>,
  { db }: { db: PouchDB.Database },
): Promise<Array<ZodIssue>> {
  const issues: Array<ZodIssue> = [];

  switch (d.__type) {
    case 'collection': {
      if (d.collection_reference_number) {
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
      if (data.collection_id) {
        try {
          await db.get(getPouchDbId('collection', data.collection_id));
        } catch (e) {
          issues.push({
            code: 'custom',
            path: ['collection_id'],
            message: `Can't find collection with ID "${data.collection_id}"`,
          });
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
