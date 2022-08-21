import React, { useEffect } from 'react';
import { PouchDB } from '@app/db';
import {
  selectActiveProfileNameOrThrowError,
  selectActiveProfileConfig,
} from './features/profiles';
import { useAppSelector, useAppDispatch } from '@app/redux';
import useDB from '@app/hooks/useDB';
import {
  selectDBSyncSettings,
  reportDBSyncStatus,
  clearDBSyncStatus,
} from '@app/features/db-sync/manage';
import insertTimestampIdRecord from '@app/utils/insertTimestampIdRecord';

const debugLog = console.warn;
// const debugLog = (_s: string) => {};

const EMPTY_OBJECT: { [k: string]: undefined } = {};

export default function DBSyncManager() {
  const dispatch = useAppDispatch();
  const profileName = useAppSelector(selectActiveProfileNameOrThrowError);

  const { dbSync: dbSyncConfig } =
    useAppSelector(selectActiveProfileConfig) || EMPTY_OBJECT;
  const syncSettings = useAppSelector(selectDBSyncSettings) || EMPTY_OBJECT;
  const { loggingEnabled } = syncSettings;
  // const loggingEnabled = true

  const { db, attachmentsDB, logsDB } = useDB();

  useEffect(() => {
    if (!dbSyncConfig || Object.keys(dbSyncConfig).length <= 0) {
      // debugLog('[DB Sync] no config, skipping');
      if (loggingEnabled) {
        insertTimestampIdRecord(logsDB, {
          type: 'db_sync',
          timestamp: new Date().getTime(),
          event: 'start',
          server: '_all',
          ok: true,
          raw: 'No config, skipping',
        });
      }
      return;
    }

    if (syncSettings.disabled) {
      // debugLog('[DB Sync] sync is disabled');
      if (loggingEnabled) {
        insertTimestampIdRecord(logsDB, {
          type: 'db_sync',
          timestamp: new Date().getTime(),
          event: 'start',
          server: '_all',
          ok: true,
          raw: 'Sync is disabled',
        });
      }
      return;
    }

    // debugLog('[DB Sync] initializing sync...');
    if (loggingEnabled) {
      insertTimestampIdRecord(logsDB, {
        type: 'db_sync',
        timestamp: new Date().getTime(),
        event: 'start',
        server: '_all',
        ok: true,
        raw: 'Initializing sync...',
      });
    }

    function startSync(
      syncName: string,
      localDB: PouchDB.Database,
      remoteUri: string,
      remoteUsername: string,
      remotePassword: string,
      serverName: string,
      type: 'db' | 'attachments_db',
    ): Promise<[string, PouchDB.Replication.Sync<{}> | null]> {
      return new Promise(resolve => {
        try {
          const remoteDB = new PouchDB(remoteUri, {
            skip_setup: true,
          });

          remoteDB
            .logIn(remoteUsername, remotePassword)
            .then(response => {
              // debugLog(
              //   `[DB Sync - ${syncName}] login success: ${JSON.stringify(
              //     response,
              //   )}`,
              // );
              dispatch(
                reportDBSyncStatus({
                  profileName,
                  serverName,
                  type,
                  status: 'Online',
                }),
              );
              if (loggingEnabled) {
                insertTimestampIdRecord(logsDB, {
                  type: 'db_sync',
                  timestamp: new Date().getTime(),
                  event: 'login',
                  server: syncName,
                  ok: true,
                  raw: JSON.stringify(response)?.slice(0, 8000),
                });
              }
              const sync = localDB
                .sync(remoteDB, {
                  live: true,
                  retry: true,
                })
                .on('complete', function (result) {
                  dispatch(
                    reportDBSyncStatus({
                      profileName,
                      serverName,
                      type,
                      status: 'Success',
                    }),
                  );
                  // debugLog(
                  //   `[DB Sync - ${syncName}] sync complete: ${JSON.stringify(
                  //     result,
                  //   )?.slice(0, 8000)}`,
                  // );
                  if (loggingEnabled) {
                    insertTimestampIdRecord(logsDB, {
                      type: 'db_sync',
                      timestamp: new Date().getTime(),
                      event: 'complete',
                      server: syncName,
                      ok:
                        result.pull?.ok !== false && result.push?.ok !== false,
                      raw: JSON.stringify(result)?.slice(0, 8000),
                      ...result,
                    });
                  }
                })
                .on('change', function (result) {
                  dispatch(
                    reportDBSyncStatus({
                      profileName,
                      serverName,
                      type,
                      status: 'Success',
                    }),
                  );
                  // debugLog(
                  //   `[DB Sync - ${syncName}] change synced: ${JSON.stringify(
                  //     result,
                  //   )?.slice(0, 8000)}`,
                  // );
                  if (loggingEnabled) {
                    const {
                      change: { docs: _d, ...chg },
                      ...res
                    } = result;
                    const resultWithoutDocs = { ...res, change: chg };
                    insertTimestampIdRecord(logsDB, {
                      type: 'db_sync',
                      timestamp: new Date().getTime(),
                      event: 'change',
                      server: syncName,
                      ok: result.change.ok,
                      raw: JSON.stringify(result)?.slice(0, 8000),
                      ...resultWithoutDocs,
                    });
                  }
                })
                .on('error', function (e) {
                  dispatch(
                    reportDBSyncStatus({
                      profileName,
                      serverName,
                      type,
                      status: 'Error',
                      message: JSON.stringify(e)?.slice(0, 8000),
                    }),
                  );
                  debugLog(
                    `[DB Sync - ${syncName}] sync error: ${JSON.stringify(
                      e,
                    )?.slice(0, 8000)}`,
                  );
                  if (loggingEnabled) {
                    insertTimestampIdRecord(logsDB, {
                      type: 'db_sync',
                      timestamp: new Date().getTime(),
                      event: 'error',
                      server: syncName,
                      ok: false,
                      raw: JSON.stringify(e)?.slice(0, 8000),
                    });
                  }
                })
                .on('paused', function (e) {
                  // debugLog(
                  //   `[DB Sync - ${syncName}] sync error: ${JSON.stringify(
                  //     e,
                  //   )?.slice(0, 8000)}`,
                  // );
                  // if (loggingEnabled) {
                  //   insertTimestampIdRecord(logsDB, {
                  //     type: 'db_sync',
                  //     timestamp: new Date().getTime(),
                  //     event: 'paused',
                  //     server: syncName,
                  //     ok: false,
                  //     raw: JSON.stringify(e)?.slice(0, 8000),
                  //   });
                  // }
                })
                .on('active', function () {
                  // debugLog(
                  //   `[DB Sync - ${syncName}] sync error: ${JSON.stringify(e)?.slice(
                  //     0,
                  //     8000,
                  //   )}`,
                  // );
                  // if (loggingEnabled) {
                  //   insertTimestampIdRecord(logsDB, {
                  //     type: 'db_sync',
                  //     timestamp: new Date().getTime(),
                  //     event: 'active',
                  //     server: syncName,
                  //     ok: true,
                  //   });
                  // }
                })
                .on('denied', function (e) {
                  // debugLog(
                  //   `[DB Sync - ${syncName}] sync error: ${JSON.stringify(
                  //     e,
                  //   )?.slice(0, 8000)}`,
                  // );
                  if (loggingEnabled) {
                    insertTimestampIdRecord(logsDB, {
                      type: 'db_sync',
                      timestamp: new Date().getTime(),
                      event: 'denied',
                      server: syncName,
                      ok: false,
                      raw: JSON.stringify(e)?.slice(0, 8000),
                    });
                  }
                  // TODO: Report status?
                });
              resolve([syncName, sync]);
            })
            .catch(e => {
              dispatch(
                reportDBSyncStatus({
                  profileName,
                  serverName,
                  type,
                  status: 'AuthError',
                  message: JSON.stringify(e)?.slice(0, 8000),
                }),
              );
              debugLog(
                `[DB Sync - ${syncName}] login fail: ${JSON.stringify(e)}`,
              );
              if (loggingEnabled) {
                insertTimestampIdRecord(logsDB, {
                  type: 'db_sync',
                  timestamp: new Date().getTime(),
                  event: 'login',
                  server: syncName,
                  ok: false,
                  raw: JSON.stringify(e)?.slice(0, 8000),
                });
              }
              resolve([syncName, null]);
            });
        } catch (e) {
          dispatch(
            reportDBSyncStatus({
              profileName,
              serverName,
              type,
              status: 'Offline',
              message: JSON.stringify(e)?.slice(0, 8000),
            }),
          );
          if (loggingEnabled) {
            insertTimestampIdRecord(logsDB, {
              type: 'db_sync',
              timestamp: new Date().getTime(),
              event: 'login',
              server: syncName,
              ok: false,
              raw: JSON.stringify(e)?.slice(0, 8000),
            });
          }
          resolve([syncName, null]);
        }
      });
    }

    const syncPromises = Object.entries(dbSyncConfig)
      .filter(
        ([serverName]) =>
          !(syncSettings?.serverSettings || {})[serverName]?.disabled,
      )
      .flatMap(([name, config]) => [
        startSync(
          `${name} DB`,
          db,
          config.db.uri,
          config.db.username,
          config.db.password,
          name,
          'db',
        ),
        startSync(
          `${name} ADB`,
          attachmentsDB,
          config.attachmentsDB.uri,
          config.attachmentsDB.username,
          config.attachmentsDB.password,
          name,
          'attachments_db',
        ),
      ]);

    return () => {
      if (loggingEnabled) {
        insertTimestampIdRecord(logsDB, {
          type: 'db_sync',
          timestamp: new Date().getTime(),
          event: 'stop',
          server: '_all',
          ok: true,
          raw: 'Canceling all syncs...',
        });
      }

      syncPromises.forEach(async syncPromise => {
        const [syncName, sync] = await syncPromise;
        if (!sync) {
          // debugLog(`[DB Sync - ${syncName}] stop: not started`);
          if (loggingEnabled) {
            insertTimestampIdRecord(logsDB, {
              type: 'db_sync',
              timestamp: new Date().getTime(),
              event: 'stop',
              server: syncName,
              ok: true,
              raw: 'Not started, ignoring',
            });
          }
          return;
        }

        sync.cancel();
        // debugLog(`[DB Sync - ${syncName}] stop: cancel called`);
        insertTimestampIdRecord(logsDB, {
          type: 'db_sync',
          timestamp: new Date().getTime(),
          event: 'stop',
          server: syncName,
          ok: true,
          raw: 'Cancel called',
        });
      });
    };
  }, [attachmentsDB, db, dbSyncConfig, loggingEnabled, logsDB, syncSettings]);

  return null;
}
