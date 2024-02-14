import { configSchema, ConfigType } from '@invt/data/schema';
import { GetConfig } from '@invt/data/types';
import type nano from 'nano';
import { v4 as uuid } from 'uuid';

import { Context } from './types';

export const CONFIG_ID = '0000-config' as const;

export const getInitialConfig: () => ConfigType = () => ({
  uuid: uuid(),
  rfid_tag_company_prefix: '0000000',
  rfid_tag_individual_asset_reference_prefix: '100',
  rfid_tag_access_password: '12345678',
  default_use_mixed_rfid_tag_access_password: false,
  rfid_tag_access_password_encoding: '082a4c6e',
  collections_order: [],
});

export default function getGetConfig({
  db,
  dbType,
  logger,
  logLevels,
}: Context) {
  const getConfigFn: GetConfig = async function getConfig({
    ensureSaved,
  } = {}) {
    const dbGet = (docId: string) => {
      if (dbType === 'pouchdb') {
        return db.get(docId);
      } else {
        return db.get(docId);
      }
    };

    try {
      const configDoc = await dbGet(CONFIG_ID);
      const config = configSchema.parse(configDoc);
      return config;
    } catch (e) {
      if (
        typeof e === 'object' &&
        ((e as any).name === 'not_found' || (e as any).message === 'missing') &&
        !ensureSaved
      ) {
        return getInitialConfig();
      } else {
        throw new Error(
          `getConfig error: ${
            e instanceof Error ? e.message : 'unknown error'
          }`,
        );
      }
    }
  };

  return getConfigFn;
}
