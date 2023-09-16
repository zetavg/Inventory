import appLogger, { getLevelsToLog } from '@app/logger';

import { getDatumFromDoc, getPouchDbId } from '../pouchdb-utils';
import { DataTypeName } from '../schema';
import {
  DataTypeWithAdditionalInfo,
  GetDatum,
  InvalidDataTypeWithAdditionalInfo,
} from '../types';

export function getGetDatum({
  db,
  logger,
}: {
  db: PouchDB.Database;
  logger: typeof appLogger;
}): GetDatum {
  const getDatum: GetDatum = async function getDatum(type, id) {
    if (getLevelsToLog().includes('debug')) {
      logger.debug(`getDatum: ${type} ${id}`);
    }

    const doc =
      (await db.get(getPouchDbId(type, id)).catch(e => {
        if (e instanceof Error && e.name === 'not_found') {
          return null;
        }

        throw e;
      })) || null;
    if (!doc) return null;

    return getDatumFromDoc(type, doc, logger);
  };

  return getDatum;
}

export default async function getDatumLegacy<T extends DataTypeName>(
  type: T,
  id: string,
  context: {
    db: PouchDB.Database;
    logger: typeof appLogger;
  },
): Promise<
  DataTypeWithAdditionalInfo<T> | InvalidDataTypeWithAdditionalInfo<T> | null
> {
  return await getGetDatum(context)(type, id);
}
