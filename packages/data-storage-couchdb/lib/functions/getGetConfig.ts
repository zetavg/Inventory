import { v4 as uuid } from 'uuid';
import type nano from 'nano';

import { configSchema, ConfigType } from '@deps/data/schema';
import { GetConfig } from '@deps/data/types';

const CONFIG_ID = '0000-config' as const;

export const INITIAL_CONFIG: ConfigType = {
  uuid: uuid(),
  rfid_tag_company_prefix: '0000000',
  rfid_tag_individual_asset_reference_prefix: '100',
  rfid_tag_access_password: '12345678',
  default_use_mixed_rfid_tag_access_password: false,
  rfid_tag_access_password_encoding: '082a4c6e',
  collections_order: [],
};

export default function getGetConfig({
  db,
}: {
  db: nano.DocumentScope<unknown>;
}) {
  const getConfigFn: GetConfig = async function getConfig({
    ensureSaved,
  } = {}) {
    try {
      const configDoc = await db.get(CONFIG_ID);
      const config = configSchema.parse(configDoc);
      return config;
    } catch (e) {
      if (
        typeof e === 'object' &&
        (e as any).name === 'not_found' &&
        !ensureSaved
      ) {
        return INITIAL_CONFIG;
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
