import appLogger from '@app/logger';

import { getDatumFromDoc, getPouchDbId } from '../pouchdb-utils';
import { DataTypeName } from '../schema';
import { DataTypeWithAdditionalInfo } from '../types';

export default async function getDatum<T extends DataTypeName>(
  type: T,
  id: string,
  {
    db,
    logger,
    validate,
  }: {
    db: PouchDB.Database;
    logger: typeof appLogger;
    validate?: boolean;
  },
): Promise<{ datum: DataTypeWithAdditionalInfo<T> | null; rawDatum: unknown }> {
  const doc =
    (await db.get(getPouchDbId(type, id)).catch(e => {
      if (e instanceof Error && e.name === 'not_found') {
        return null;
      }

      throw e;
    })) || null;
  return {
    datum: getDatumFromDoc(type, doc, logger, {
      validate: typeof validate === 'boolean' ? validate : true,
    }),
    rawDatum: doc,
  };
}
