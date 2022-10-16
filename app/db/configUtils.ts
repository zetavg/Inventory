import { Database } from './pouchdb';
import { ConfigStoredInDB } from './types';

const CONFIG_ID = '0000-config';

const DEFAULT_CONFIG: ConfigStoredInDB = {
  epcCompanyPrefix: '0000000',
  rfidTagAccessPassword: '12345678',
  rfidTagAccessPasswordEncoding: '01234567',
  epcPrefix: 10,
};

/**
 * Get config stored in database.
 */
export async function getConfigInDB(db: Database): Promise<ConfigStoredInDB> {
  try {
    const data = await db.get(CONFIG_ID);
    return {
      ...DEFAULT_CONFIG,
      ...data,
    };
  } catch (e) {
    // TODO: Handle errors that are not 404
    return DEFAULT_CONFIG;
  }
}
