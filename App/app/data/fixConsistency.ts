import appLogger from '@app/logger';

import { getDatumFromDoc } from './hooks/useData';
import { beforeSave } from './callbacks';
import { getDataIdFromPouchDbId, getDataTypeSelector } from './pouchdb-utils';
import schema, { DATA_TYPE_NAMES, DataTypeName } from './schema';
import { DataTypeWithAdditionalInfo } from './types';

const logger = appLogger.for({ module: 'fixConsistency' });

/**
 * It's highly recommended to backup the database before doing this!
 */
export default async function fixConsistency({
  db,
  successCallback,
  errorCallback,
  batchSize = 10,
}: {
  db: PouchDB.Database;
  successCallback: (data: DataTypeWithAdditionalInfo<DataTypeName>) => void;
  errorCallback: (info: {
    type: string;
    id?: string;
    rawId: string;
    error: unknown;
  }) => void;
  batchSize?: number;
}) {
  for (const typeName of DATA_TYPE_NAMES) {
    let ended = false;
    let batch = 0;
    while (!ended) {
      const response = await db.find({
        selector: getDataTypeSelector(typeName),
        limit: batchSize,
        skip: batchSize * batch,
      });
      if (response.docs.length === 0) {
        ended = true;
        continue;
      }

      for (const doc of response.docs) {
        let id: string | undefined;
        try {
          id = getDataIdFromPouchDbId(doc._id).id;
          const data = getDatumFromDoc(typeName, doc, logger, {
            validate: false,
          });
          if (!data) throw new Error('getDatumFromDoc returns null');
          beforeSave(data);
          schema[typeName].parse(data);

          // await new Promise(resolve =>
          //   setTimeout(() => {
          //     resolve(null);
          //   }, 10),
          // );

          await db.put({ ...doc });

          // await new Promise(resolve =>
          //   setTimeout(() => {
          //     resolve(null);
          //   }, 10),
          // );

          successCallback(data);
        } catch (e) {
          errorCallback({
            type: typeName,
            id,
            rawId: doc._id,
            error: e,
          });
        }
      }

      batch += 1;
    }
  }
}
