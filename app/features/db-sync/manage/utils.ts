import { Status, ServerStatus } from './statusSlice';

export function isErrorStatus(s: Status | null | undefined | 'Disabled') {
  return s === 'Error' || s === 'Auth Error' || s === 'Config Error';
}

export type ReducedServerStatus = {
  status: Status | 'Disabled' | null;
  lastUpdatedAt?: number;
};

export function reduceServerStatus(
  status: ServerStatus,
  serverDisabled: boolean,
  allDisabled: boolean,
) {
  const s: ReducedServerStatus['status'] = (() => {
    if (allDisabled) return null;
    if (serverDisabled) return 'Disabled';

    if (
      status.db?.lastStatus === 'Auth Error' ||
      status.attachments_db?.lastStatus === 'Auth Error'
    ) {
      return 'Auth Error';
    }

    if (
      status.db?.lastStatus === 'Config Error' ||
      status.attachments_db?.lastStatus === 'Config Error'
    ) {
      return 'Config Error';
    }

    if (
      status.db?.lastStatus === 'Error' ||
      status.attachments_db?.lastStatus === 'Error'
    ) {
      return 'Error';
    }

    if (
      status.db?.lastStatus === 'Offline' ||
      status.attachments_db?.lastStatus === 'Offline'
    ) {
      return 'Offline';
    }

    if (status.db?.lastStatus === 'Success') return 'Success';
    if (status.attachments_db?.lastStatus === 'Success') return 'Success';
    return 'Online';
  })();

  let lastSyncedAt: number | undefined = Math.max(
    status.db?.lastUpdatedAt || 0,
    status.attachments_db?.lastUpdatedAt || 0,
  );

  if (
    status.db?.lastStatus !== 'Success' &&
    status.db?.lastStatus !== 'Online'
  ) {
    lastSyncedAt = status.db?.lastUpdatedAt;
  }

  if (
    status.attachments_db?.lastStatus !== 'Success' &&
    status.attachments_db?.lastStatus !== 'Online'
  ) {
    lastSyncedAt = status.attachments_db?.lastUpdatedAt;
  }

  return {
    status: s,
    lastSyncedAt,
  };
}
