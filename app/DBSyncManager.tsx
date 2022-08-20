import React, { useEffect } from 'react';
import { PouchDB } from '@app/db';
import { selectActiveProfileConfig } from './features/profiles';
import { useAppSelector } from './redux';
import useDB from './hooks/useDB';

export default function DBSyncManager() {
  const { dbSync: dbSyncConfig } =
    useAppSelector(selectActiveProfileConfig) || {};
  const { db, attachmentsDB } = useDB();

  useEffect(() => {
    if (!dbSyncConfig || Object.keys(dbSyncConfig).length <= 0) {
      console.warn('[DB Sync] no config, skipping');
      return;
    }

    console.warn('[DB Sync] initializing sync...');

    const syncPromises = Object.entries(dbSyncConfig).flatMap(
      ([name, config]) => [
        startSync(
          `${name} DB`,
          db,
          config.db.uri,
          config.db.username,
          config.db.password,
        ),
        startSync(
          `${name} ADB`,
          attachmentsDB,
          config.attachmentsDB.uri,
          config.attachmentsDB.username,
          config.attachmentsDB.password,
        ),
      ],
    );

    return () => {
      console.warn('[DB Sync] stopping sync...');

      syncPromises.forEach(async syncPromise => {
        const [syncName, sync] = await syncPromise;
        if (!sync) {
          console.warn(`[DB Sync - ${syncName}] stop: not started`);
          return;
        }

        sync.cancel();
        console.warn(`[DB Sync - ${syncName}] stop: cancel called`);
      });
    };
  }, [attachmentsDB, db, dbSyncConfig]);

  return null;
}

function startSync(
  syncName: string,
  db: PouchDB.Database,
  remoteUri: string,
  remoteUsername: string,
  remotePassword: string,
): Promise<[string, PouchDB.Replication.Sync<{}> | null]> {
  return new Promise(resolve => {
    const remoteDB = new PouchDB(remoteUri, {
      skip_setup: true,
    });

    remoteDB
      .logIn(remoteUsername, remotePassword)
      .then(response => {
        console.warn(
          `[DB Sync - ${syncName}] login success: ${JSON.stringify(response)}`,
        );
        const sync = db
          .sync(remoteDB, {
            live: true,
          })
          .on('complete', function (d) {
            console.warn(
              `[DB Sync - ${syncName}] sync complete: ${JSON.stringify(d).slice(
                0,
                1024,
              )}`,
            );
          })
          .on('change', function (change) {
            console.warn(
              `[DB Sync - ${syncName}] change synced: ${JSON.stringify(
                change,
              ).slice(0, 1024)}`,
            );
          })
          .on('error', function (e) {
            console.warn(
              `[DB Sync - ${syncName}] sync error: ${JSON.stringify(e).slice(
                0,
                1024,
              )}`,
            );
          });
        resolve([syncName, sync]);
      })
      .catch(e => {
        console.warn(
          `[DB Sync - ${syncName}] login fail: ${JSON.stringify(e)}`,
        );
        resolve([syncName, null]);
      });
  });
}
