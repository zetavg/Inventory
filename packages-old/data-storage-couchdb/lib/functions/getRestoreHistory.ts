import dGetRestoreHistory from '@deps/data/functions/getRestoreHistory';
import { RestoreHistory } from '@deps/data/types';

import getSaveDatum from './getSaveDatum';
import { Context } from './types';

export default function getRestoreHistory(context: Context): RestoreHistory {
  const saveDatum = getSaveDatum(context);

  const restoreHistory = dGetRestoreHistory({
    saveDatum,
  });

  return restoreHistory;
}
