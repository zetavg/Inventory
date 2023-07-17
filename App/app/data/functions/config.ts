import { configSchema, ConfigType } from '../schema';

const CONFIG_ID = '0000-config' as const;

const INITIAL_CONFIG: ConfigType = {
  rfid_tag_access_password: '12345678',
  rfid_tag_access_password_encoding: '08192a3b',
  rfid_tag_company_prefix: '0000000',
  rfid_tag_prefix: '100',
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

export async function getConfig({
  db,
}: {
  db: PouchDB.Database;
}): Promise<ConfigType> {
  try {
    const configDoc = await db.get(CONFIG_ID);
    const config = configSchema.parse(configDoc);
    return config;
  } catch (e) {
    if (typeof e === 'object' && (e as any).name === 'not_found') {
      return INITIAL_CONFIG;
    } else {
      throw e;
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
    ...oldConfig,
    ...config,
  });
  await db.put(newConfig);
  return await getConfig({ db });
}
