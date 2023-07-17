import appLogger from '@app/logger';

import { getDatumFromDoc, getPouchDbId } from '../pouchdb-utils';
import { DataTypeName } from '../schema';
import {
  DataTypeWithAdditionalInfo,
  InvalidDataTypeWithAdditionalInfo,
} from '../types';

export default async function getDatum<T extends DataTypeName>(
  type: T,
  id: string,
  {
    db,
    logger,
  }: {
    db: PouchDB.Database;
    logger: typeof appLogger;
  },
): Promise<
  DataTypeWithAdditionalInfo<T> | InvalidDataTypeWithAdditionalInfo<T>
> {
  const doc =
    (await db.get(getPouchDbId(type, id)).catch(e => {
      if (e instanceof Error && e.name === 'not_found') {
        return null;
      }

      throw e;
    })) || null;
  return getDatumFromDoc(type, doc, logger);
}
