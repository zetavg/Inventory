import { deleteSqliteDb } from '@app/db/sqlite';

import {
  getDbNameFromProfileUuid,
  getLogsDbNameFromProfileUuid,
} from './slice';

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

  await Promise.all(
    [
      getDbNameFromProfileUuid(profileUuid),
      getLogsDbNameFromProfileUuid(profileUuid),
    ].map(dbName => deleteSqliteDb(dbName)),
  );
}

export default beforeDeleteProfile;
