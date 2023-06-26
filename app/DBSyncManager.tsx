import React, { useEffect, useRef } from 'react';

import { useAppDispatch, useAppSelector } from '@app/redux';
// import {
//   clearDBSyncStatus,
//   reportDBSyncStatus,
//   selectDBSyncSettings,
// } from '@app/features/db-sync/manage';

// import { PouchDB } from '@app/db';

// import insertTimestampIdRecord from '@app/utils/insertTimestampIdRecord';

// import useDB from '@app/hooks/useDB';

// import { updateV } from './features/db-sync/manage/statusSlice';
// import {
//   selectActiveProfileConfig,
//   selectActiveProfileNameOrThrowError,
// } from './features/profiles';

// const debugLog = console.warn;
// // const debugLog = (_s: string) => {};

// type SyncRef = {
//   sync: PouchDB.Replication.Sync<{}> | null;
//   remoteDB: PouchDB.Database<{}> | null;
//   canceled: boolean;
// };

// const EMPTY_OBJECT: { [k: string]: undefined } = {};

export default function DBSyncManager() {
  return null;
  // const dispatch = useAppDispatch();
  // const profileName = useAppSelector(selectActiveProfileNameOrThrowError);

  // const { dbSync: dbSyncConfig } =
  //   useAppSelector(selectActiveProfileConfig) || EMPTY_OBJECT;
  // const syncSettings = useAppSelector(selectDBSyncSettings) || EMPTY_OBJECT;
  // const { loggingEnabled } = syncSettings;
  // // const loggingEnabled = true

  // const { db, attachmentsDB, logsDB } = useDB();
  // const version = useRef(0);

  // useEffect(() => {
  //   if (!dbSyncConfig || Object.keys(dbSyncConfig).length <= 0) {
  //     // debugLog('[DB Sync] no config, skipping');
  //     if (loggingEnabled) {
  //       insertTimestampIdRecord(logsDB, {
  //         type: 'db_sync',
  //         timestamp: new Date().getTime(),
  //         event: 'start',
  //         server: '_all',
  //         ok: true,
  //         raw: 'No config, skipping',
  //       });
  //     }
  //     return;
  //   }

  //   if (syncSettings.disabled) {
  //     // debugLog('[DB Sync] sync is disabled');
  //     if (loggingEnabled) {
  //       insertTimestampIdRecord(logsDB, {
  //         type: 'db_sync',
  //         timestamp: new Date().getTime(),
  //         event: 'start',
  //         server: '_all',
  //         ok: true,
  //         raw: 'Sync is disabled',
  //       });
  //     }
  //     return;
  //   }

  //   version.current += 1;
  //   const v = version.current;
  //   dispatch(updateV({ profileName, v }));

  //   // debugLog('[DB Sync] initializing sync...');
  //   if (loggingEnabled) {
  //     insertTimestampIdRecord(logsDB, {
  //       type: 'db_sync',
  //       timestamp: new Date().getTime(),
  //       event: 'start',
  //       server: '_all',
  //       raw: 'Initializing sync...',
  //     });
  //   }

  //   function startSync(
  //     syncName: string,
  //     localDB: PouchDB.Database,
  //     remoteUri: string,
  //     remoteUsername: string,
  //     remotePassword: string,
  //     serverName: string,
  //     type: 'db' | 'attachments_db',
  //   ): Promise<[string, SyncRef]> {
  //     return new Promise(async resolve => {
  //       try {
  //         const remoteDB = new PouchDB(remoteUri, {
  //           skip_setup: true,
  //         });

  //         const syncRef: SyncRef = {
  //           sync: null,
  //           remoteDB,
  //           canceled: false,
  //         };

  //         resolve([syncName, syncRef]);

  //         function loginToRemoteDB() {
  //           remoteDB
  //             .logIn(remoteUsername, remotePassword)
  //             .then(response =>
  //               // Test if we can access the database
  //               remoteDB
  //                 .allDocs({ limit: 1, include_docs: false })
  //                 .then(() => response),
  //             )
  //             .then(response => {
  //               dispatch(
  //                 reportDBSyncStatus({
  //                   v,
  //                   profileName,
  //                   serverName,
  //                   type,
  //                   status: 'Online',
  //                 }),
  //               );
  //               startInitialSync();
  //               if (loggingEnabled) {
  //                 insertTimestampIdRecord(logsDB, {
  //                   type: 'db_sync',
  //                   timestamp: new Date().getTime(),
  //                   event: 'login',
  //                   server: syncName,
  //                   ok: true,
  //                   raw: JSON.stringify(response)?.slice(0, 8000),
  //                 });
  //               }
  //             })
  //             .catch((e: any) => {
  //               switch (e?.error) {
  //                 case 'unauthorized':
  //                   dispatch(
  //                     reportDBSyncStatus({
  //                       v,
  //                       profileName,
  //                       serverName,
  //                       type,
  //                       status: 'Auth Error',
  //                       message: e.reason,
  //                     }),
  //                   );
  //                   break;
  //                 case 'not_found':
  //                   dispatch(
  //                     reportDBSyncStatus({
  //                       v,
  //                       profileName,
  //                       serverName,
  //                       type,
  //                       status: 'Config Error',
  //                       message: e.reason,
  //                     }),
  //                   );
  //                   break;
  //                 default:
  //                   if (e?.code === 'ETIMEDOUT') {
  //                     dispatch(
  //                       reportDBSyncStatus({
  //                         v,
  //                         profileName,
  //                         serverName,
  //                         type,
  //                         status: 'Offline',
  //                         message: JSON.stringify(e)?.slice(0, 8000),
  //                       }),
  //                     );
  //                   } else if (e?.status === 0) {
  //                     dispatch(
  //                       reportDBSyncStatus({
  //                         v,
  //                         profileName,
  //                         serverName,
  //                         type,
  //                         status: 'Offline',
  //                         message: JSON.stringify(e)?.slice(0, 8000),
  //                       }),
  //                     );
  //                   } else {
  //                     dispatch(
  //                       reportDBSyncStatus({
  //                         v,
  //                         profileName,
  //                         serverName,
  //                         type,
  //                         status: 'Config Error',
  //                         message:
  //                           e?.reason ||
  //                           `Cannot connect to server: ${JSON.stringify(
  //                             e,
  //                           )?.slice(0, 8000)}.`,
  //                       }),
  //                     );
  //                   }
  //                   break;
  //               }
  //               if (loggingEnabled) {
  //                 insertTimestampIdRecord(logsDB, {
  //                   type: 'db_sync',
  //                   timestamp: new Date().getTime(),
  //                   event: 'login',
  //                   server: syncName,
  //                   ok: false,
  //                   raw: JSON.stringify(e)?.slice(0, 8000),
  //                 });
  //               }
  //             });
  //         }

  //         loginToRemoteDB();

  //         function addSyncEventListeners(
  //           sync: PouchDB.Replication.Sync<{}>,
  //           { live }: { live: boolean },
  //         ) {
  //           sync
  //             .on('complete', function (result) {
  //               if (live || syncRef.canceled) {
  //                 dispatch(
  //                   reportDBSyncStatus({
  //                     v,
  //                     profileName,
  //                     serverName,
  //                     type,
  //                     status: 'Offline',
  //                   }),
  //                 );
  //               } else {
  //                 dispatch(
  //                   reportDBSyncStatus({
  //                     v,
  //                     profileName,
  //                     serverName,
  //                     type,
  //                     status: 'Success',
  //                   }),
  //                 );
  //                 startLiveSync();
  //               }

  //               if (loggingEnabled) {
  //                 insertTimestampIdRecord(logsDB, {
  //                   type: 'db_sync',
  //                   timestamp: new Date().getTime(),
  //                   event: 'complete',
  //                   server: syncName,
  //                   live,
  //                   canceled: syncRef.canceled,
  //                   ok: result.pull?.ok !== false && result.push?.ok !== false,
  //                   raw: JSON.stringify(result)?.slice(0, 8000),
  //                   ...result,
  //                 });
  //               }
  //             })
  //             .on('change', function (result) {
  //               if (live) {
  //                 dispatch(
  //                   reportDBSyncStatus({
  //                     v,
  //                     profileName,
  //                     serverName,
  //                     type,
  //                     status: 'Success',
  //                   }),
  //                 );
  //               }
  //               // debugLog(
  //               //   `[DB Sync - ${syncName}] change synced: ${JSON.stringify(
  //               //     result,
  //               //   )?.slice(0, 8000)}`,
  //               // );
  //               if (loggingEnabled) {
  //                 const {
  //                   change: { docs: _d, ...chg },
  //                   ...res
  //                 } = result;
  //                 const resultWithoutDocs = { ...res, change: chg };
  //                 insertTimestampIdRecord(logsDB, {
  //                   type: 'db_sync',
  //                   timestamp: new Date().getTime(),
  //                   event: 'change',
  //                   server: syncName,
  //                   live,
  //                   ok: result.change.ok,
  //                   raw: JSON.stringify(result)?.slice(0, 8000),
  //                   ...resultWithoutDocs,
  //                 });
  //               }
  //             })
  //             .on('error', function (e) {
  //               if (live) {
  //                 dispatch(
  //                   reportDBSyncStatus({
  //                     v,
  //                     profileName,
  //                     serverName,
  //                     type,
  //                     status: 'Error',
  //                     message: JSON.stringify(e)?.slice(0, 8000),
  //                   }),
  //                 );
  //                 debugLog(
  //                   `[DB Sync - ${syncName}] sync error: ${JSON.stringify(
  //                     e,
  //                   )?.slice(0, 8000)}`,
  //                 );
  //               } else {
  //                 // TODO: Handle other errors
  //                 dispatch(
  //                   reportDBSyncStatus({
  //                     v,
  //                     profileName,
  //                     serverName,
  //                     type,
  //                     status: 'Offline',
  //                     message: JSON.stringify(e)?.slice(0, 8000),
  //                   }),
  //                 );
  //                 setTimeout(startInitialSync, 5000);
  //               }
  //               if (loggingEnabled) {
  //                 insertTimestampIdRecord(logsDB, {
  //                   type: 'db_sync',
  //                   timestamp: new Date().getTime(),
  //                   event: 'error',
  //                   server: syncName,
  //                   live,
  //                   ok: false,
  //                   raw: JSON.stringify(e)?.slice(0, 8000),
  //                 });
  //               }
  //             })
  //             .on('paused', async function (e) {
  //               // dispatch(
  //               //   reportDBSyncStatus({
  //               //     profileName,
  //               //     serverName,
  //               //     type,
  //               //     status: 'Success',
  //               //   }),
  //               // );
  //               // debugLog(
  //               //   `[DB Sync - ${syncName}] sync error: ${JSON.stringify(
  //               //     e,
  //               //   )?.slice(0, 8000)}`,
  //               // );
  //               if (loggingEnabled) {
  //                 insertTimestampIdRecord(logsDB, {
  //                   type: 'db_sync',
  //                   timestamp: new Date().getTime(),
  //                   event: 'paused',
  //                   server: syncName,
  //                   live,
  //                   raw: JSON.stringify(e)?.slice(0, 8000),
  //                   ok: !e,
  //                 });
  //               }
  //             })
  //             .on('active', function () {
  //               dispatch(
  //                 reportDBSyncStatus({
  //                   v,
  //                   profileName,
  //                   serverName,
  //                   type,
  //                   status: 'Syncing',
  //                 }),
  //               );
  //               // debugLog(
  //               //   `[DB Sync - ${syncName}] sync error: ${JSON.stringify(e)?.slice(
  //               //     0,
  //               //     8000,
  //               //   )}`,
  //               // );
  //               if (loggingEnabled) {
  //                 insertTimestampIdRecord(logsDB, {
  //                   type: 'db_sync',
  //                   timestamp: new Date().getTime(),
  //                   event: 'active',
  //                   server: syncName,
  //                   live,
  //                 });
  //               }
  //             })
  //             .on('denied', function (e) {
  //               // debugLog(
  //               //   `[DB Sync - ${syncName}] sync error: ${JSON.stringify(
  //               //     e,
  //               //   )?.slice(0, 8000)}`,
  //               // );
  //               if (loggingEnabled) {
  //                 insertTimestampIdRecord(logsDB, {
  //                   type: 'db_sync',
  //                   timestamp: new Date().getTime(),
  //                   event: 'denied',
  //                   server: syncName,
  //                   live,
  //                   raw: JSON.stringify(e)?.slice(0, 8000),
  //                 });
  //               }
  //             });

  //           return sync;
  //         }

  //         function startInitialSync() {
  //           if (syncRef.sync) syncRef.sync.cancel();
  //           if (syncRef.canceled) return;

  //           dispatch(
  //             reportDBSyncStatus({
  //               v,
  //               profileName,
  //               serverName,
  //               type,
  //               status: 'Syncing',
  //             }),
  //           );

  //           syncRef.sync = addSyncEventListeners(localDB.sync(remoteDB), {
  //             live: false,
  //           });
  //         }

  //         function startLiveSync() {
  //           if (syncRef.sync) syncRef.sync.cancel();
  //           if (syncRef.canceled) return;

  //           syncRef.sync = addSyncEventListeners(
  //             localDB.sync(remoteDB, {
  //               live: true,
  //               retry: true,
  //             }),
  //             { live: true },
  //           );

  //           setTimeout(startInitialSync, 1000 * 60 * 30);
  //         }
  //       } catch (e: any) {
  //         // TODO: Handle unknown error
  //       }
  //     });
  //   }

  //   const syncPromises = Object.entries(dbSyncConfig)
  //     .filter(
  //       ([serverName]) =>
  //         !(syncSettings?.serverSettings || {})[serverName]?.disabled,
  //     )
  //     .flatMap(([name, config]) => [
  //       startSync(
  //         `${name} DB`,
  //         db,
  //         config.db.uri,
  //         config.db.username,
  //         config.db.password,
  //         name,
  //         'db',
  //       ),
  //       startSync(
  //         `${name} ADB`,
  //         attachmentsDB,
  //         config.attachmentsDB.uri,
  //         config.attachmentsDB.username,
  //         config.attachmentsDB.password,
  //         name,
  //         'attachments_db',
  //       ),
  //     ]);

  //   return () => {
  //     if (loggingEnabled) {
  //       insertTimestampIdRecord(logsDB, {
  //         type: 'db_sync',
  //         timestamp: new Date().getTime(),
  //         event: 'stop',
  //         server: '_all',
  //         ok: true,
  //         raw: 'Canceling all syncs...',
  //       });
  //     }

  //     syncPromises.forEach(async syncPromise => {
  //       const [syncName, syncRef] = await syncPromise;
  //       if (!syncRef.sync) {
  //         // debugLog(`[DB Sync - ${syncName}] stop: not started`);
  //         if (loggingEnabled) {
  //           insertTimestampIdRecord(logsDB, {
  //             type: 'db_sync',
  //             timestamp: new Date().getTime(),
  //             event: 'stop',
  //             server: syncName,
  //             ok: true,
  //             raw: 'Not started, ignoring',
  //           });
  //         }
  //         return;
  //       }

  //       syncRef.canceled = true;
  //       syncRef.sync.cancel();
  //       // debugLog(`[DB Sync - ${syncName}] stop: cancel called`);
  //       insertTimestampIdRecord(logsDB, {
  //         type: 'db_sync',
  //         timestamp: new Date().getTime(),
  //         event: 'stop',
  //         server: syncName,
  //         ok: true,
  //         raw: 'Cancel called',
  //       });
  //     });
  //   };
  // }, [
  //   attachmentsDB,
  //   db,
  //   dbSyncConfig,
  //   dispatch,
  //   loggingEnabled,
  //   logsDB,
  //   profileName,
  //   syncSettings,
  // ]);

  // return null;
}
