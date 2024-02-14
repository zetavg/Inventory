import appLogger from '@app/logger';

import { deleteSqliteDb } from '@app/db/sqlite';

import { getDbNameFromProfileUuid } from './slice';

const logger = appLogger.for({
  module: 'f/profiles',
  function: 'beforeDeleteProfile',
});

async function beforeDeleteProfile(
  profileUuid: string,
  {
    currentProfileUuid,
  }: {
    currentProfileUuid: string | undefined;
  },
) {
  if (profileUuid === currentProfileUuid) {
    throw new Error('Cannot delete the current profile!');
  }

  const dbNamesToDelete = [getDbNameFromProfileUuid(profileUuid)];

  const results = await Promise.all(
    dbNamesToDelete.map(dbName => deleteSqliteDb(dbName)),
  );

  logger.info(
    `Deleted database ${dbNamesToDelete.map(n => `"${n}"`).join(', ')}.`,
    { details: JSON.stringify({ results }, null, 2) },
  );
}

export default beforeDeleteProfile;
