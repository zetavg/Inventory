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
  ok: boolean;
  server: string;
} & (
  | { event: 'info'; raw: string }
  | { event: 'error_recovery'; raw: string }
  | { event: 'start'; raw: string }
  | { event: 'stop'; raw: string }
  | { event: 'login'; raw: string }
  | ({
      event: 'complete';
      raw: string;
    } & PouchDB.Replication.SyncResultComplete<{}>)
  | ({
      event: 'change';
      raw: string;
    } & Omit<PouchDB.Replication.SyncResult<{}>, 'change'> & {
        change: Omit<PouchDB.Replication.SyncResult<{}>['change'], 'docs'>;
      })
  | {
      event: 'error';
      raw: string;
    }
  | {
      event: 'paused';
      raw: string;
    }
  | {
      event: 'active';
      // raw: string;
    }
  | {
      event: 'denied';
      raw: string;
    }
);

export type LogsDBContent = DBSyncLog;
