import dGetRestoreHistory from '@invt/data/functions/getRestoreHistory';
import { RestoreHistory } from '@invt/data/types';

import getSaveDatum from './getSaveDatum';
import { Context } from './types';

export default function getRestoreHistory(context: Context): RestoreHistory {
  const saveDatum = getSaveDatum(context);

  const restoreHistory = dGetRestoreHistory({
    saveDatum,
  });

  return restoreHistory;
}
