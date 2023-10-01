import dGetSaveDatum from '@deps/data/functions/getSaveDatum';
import { SaveDatum } from '@deps/data/types';

import {
  getCouchDbId,
  getDatumFromDoc,
  getDocFromDatum,
} from './couchdb-utils';
import getGetConfig from './getGetConfig';
import getGetData from './getGetData';
import getGetDatum from './getGetDatum';
import getGetRelated from './getGetRelated';
import { Context } from './types';

export default function getSaveDatum(context: Context): SaveDatum {
  const { db, dbType, logger, logLevels } = context;

  const getConfig = getGetConfig(context);
  const getDatum = getGetDatum(context);
  const getData = getGetData(context);
  const getRelated = getGetRelated(context);

  const saveDatum = dGetSaveDatum({
    getConfig,
    getDatum,
    getData,
    getRelated,
    writeDatum: async d => {
      const doc = getDocFromDatum(d);

      // Delete deprecated fields
      if ((doc.data as any)?._individual_asset_reference) {
        delete (doc.data as any)._individual_asset_reference;
      }

      if (dbType === 'pouchdb') {
        await db.put(doc);
      } else {
        await db.insert(doc);
      }
    },
    deleteDatum: async d => {
      const doc = getDocFromDatum(d);
      if (dbType === 'pouchdb') {
        await db.put({ _id: doc._id, _rev: doc._rev, _deleted: true });
      } else {
        await db.destroy(doc._id || '', doc._rev || '');
      }
    },
    skipSaveCallback: (existingData, dataToSave) => {
      const logDebug = logLevels && logLevels().includes('debug');
      if (logger && logDebug) {
        logger.debug(
          `saveDatum: skipping save since data has no changes between existing data ${JSON.stringify(
            existingData,
            null,
            2,
          )} and data to save ${JSON.stringify(dataToSave, null, 2)}`,
        );
      }
    },
  });

  return saveDatum;
}
