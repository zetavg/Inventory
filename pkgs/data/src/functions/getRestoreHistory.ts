import { DataHistory, DataTypeName, RestoreHistory, SaveDatum } from '../types';

export default function getRestoreHistory({
  saveDatum,
}: {
  saveDatum: SaveDatum;
}): RestoreHistory {
  const restoreHistory: any = async <T extends DataTypeName>(
    history: DataHistory<T>,
    { batch }: { batch?: number } = {},
  ) => {
    const { data_type, data_id, original_data } = history;
    const savedData = await saveDatum(
      {
        __type: data_type,
        __id: data_id,
        ...(original_data || {}),
      },
      {
        ignoreConflict: true,
        createHistory: { createdBy: 'history_restore', batch },
      },
    );

    return savedData;
  };

  return restoreHistory;
}
