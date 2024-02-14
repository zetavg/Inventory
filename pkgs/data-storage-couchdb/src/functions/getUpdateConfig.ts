import { UpdateConfig } from '@invt/data/types';

import getGetConfig, { CONFIG_ID } from './getGetConfig';
import { Context } from './types';

export default function getUpdateConfig(context: Context): UpdateConfig {
  const { db, dbType, logger, logLevels } = context;

  const getConfig = getGetConfig(context);

  const updateConfig: UpdateConfig = async config => {
    const newConfig = {
      _id: CONFIG_ID,
      ...(await getConfig()),
      ...config,
    };
    if (dbType === 'pouchdb') {
      await db.put(newConfig);
    } else {
      await db.insert(newConfig);
    }

    return newConfig;
  };

  return updateConfig;
}
