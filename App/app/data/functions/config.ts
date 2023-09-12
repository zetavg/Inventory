import { v4 as uuid } from 'uuid';

import { configSchema, ConfigType } from '../schema';

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

export async function hasConfig({
  db,
}: {
  db: PouchDB.Database;
}): Promise<boolean> {
  try {
    await db.get(CONFIG_ID);
    return true;
  } catch (e) {
    if (typeof e === 'object' && (e as any).name === 'not_found') {
      return false;
    } else {
      throw e;
    }
  }
}

export class GetConfigError extends Error {}

export async function getConfig(
  {
    db,
  }: {
    db: PouchDB.Database;
  },
  { ensureSaved }: { ensureSaved?: boolean } = {},
): Promise<ConfigType> {
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
      throw new GetConfigError(
        `getConfig error: ${e instanceof Error ? e.message : 'unknown error'}`,
      );
    }
  }
}

export async function updateConfig(
  config: Partial<ConfigType>,
  {
    db,
  }: {
    db: PouchDB.Database;
  },
): Promise<ConfigType> {
  const oldConfig = await getConfig({ db });
  const newConfig = configSchema.parse({
    _id: CONFIG_ID,
    ...INITIAL_CONFIG,
    ...oldConfig,
    ...config,
  });
  await db.put(newConfig);
  return await getConfig({ db });
}
