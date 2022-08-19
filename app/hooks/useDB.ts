import { selectActiveProfileRuntimeData } from '@app/features/profiles';
import { useAppSelector } from '@app/redux';
import { useMemo } from 'react';

export default function useDB() {
  const { getDB, getAttachmentsDB } = useAppSelector(
    selectActiveProfileRuntimeData,
  );

  if (!getDB) {
    throw new Error(`DB is not initialized (called by ${useDB.caller}).`);
  }
  if (!getAttachmentsDB) {
    throw new Error(
      `AttachmentsDB is not initialized (called by ${useDB.caller}).`,
    );
  }

  return useMemo(
    () => ({ db: getDB(), attachmentsDB: getAttachmentsDB() }),
    [getDB, getAttachmentsDB],
  );
}
