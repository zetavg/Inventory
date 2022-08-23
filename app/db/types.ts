export type DBContent = {
  a: any;
};

export type AttachmentsDBContent = {
  filename: string;
  thumbnail128?: string;
  thumbnail64?: string;
  content_type: string;
  data: string;
  dimensions?: {
    width: number;
    height: number;
  };
  timestamp?: string;
};

export type DBSyncLog = {
  type: 'db_sync';
  timestamp: number;
  server: string;
} & (
  | { event: 'info'; raw: string }
  | { event: 'error_recovery'; raw: string }
  | { event: 'start'; raw: string }
  | { event: 'stop'; raw: string }
  | { event: 'login'; ok: boolean; raw: string }
  | ({
      event: 'complete';
      live: boolean;
      raw: string;
      ok: boolean;
      canceled: boolean;
    } & PouchDB.Replication.SyncResultComplete<{}>)
  | ({
      event: 'change';
      live: boolean;
      raw: string;
      ok: boolean;
    } & Omit<PouchDB.Replication.SyncResult<{}>, 'change'> & {
        change: Omit<PouchDB.Replication.SyncResult<{}>['change'], 'docs'>;
      })
  | {
      event: 'error';
      live: boolean;
      raw: string;
      ok: false;
    }
  | {
      event: 'paused';
      live: boolean;
      raw: string;
      ok: boolean;
    }
  | {
      event: 'active';
      live: boolean;
      // raw: string;
    }
  | {
      event: 'denied';
      live: boolean;
      raw: string;
    }
);

export type LogsDBContent = DBSyncLog;
