#!/usr/bin/env -S npx ts-node --transpile-only

import PouchDB from 'pouchdb';
import nano from 'nano';
import { program } from 'commander';

import fs from 'fs';
import path from 'path';
import prompt from 'prompt';
import repl from 'repl';

import CouchDBData from './lib/CouchDBData';
import {
  getDatumFromDoc,
  getDocFromDatum,
} from './lib/functions/couchdb-utils';

program
  .description('Inventory CouchDB Data REPL.')
  .requiredOption(
    '-d, --db_uri <uri>',
    'Database URI, e.g. http://localhost:5984/inventory.',
  )
  .requiredOption('-u, --db_username <username>', 'Database username.')
  .option(
    '-p, --db_password <password>',
    'Database password. You can also specify a file path to load it from a file.',
  )
  .option(
    '-c, --client_type <type>',
    'Client type, either "nano", "pouchdb" or "pouchdb-websql". "pouchdb-websql" is only for development purpose to simulate using SQLite on mobile devices, do not use it to connect a production database.',
    value => {
      const validValues = ['nano', 'pouchdb', 'pouchdb-websql'];
      if (!validValues.includes(value)) {
        console.error(
          `Invalid value for --client_type. Must be one of: ${validValues.join(
            ', ',
          )}`,
        );
        process.exit(1);
      }
      return value;
    },
    'nano',
  )
  .option('--debug', 'Enable debug output.');

program.parse(process.argv);

const options = program.opts();

const historyFilePath = path.join(__dirname, '.repl_history');

function getPassword(callback: () => void) {
  if (!options.db_password) {
    prompt.start();
    prompt.get(
      [
        {
          name: 'password',
          hidden: true,
          required: true,
          description: `CouchDB password for user ${options.db_username}`,
        },
      ],
      function (err, result) {
        if (err) throw err;
        options.db_password = result.password;
        callback();
      },
    );
  } else {
    callback();
  }
}

getPassword(async () => {
  const { db_uri, db_username, db_password, client_type } = options;

  const dbUrlObject = new URL(db_uri);
  const dbProtocol = dbUrlObject.protocol;
  const dbHost = dbUrlObject.host;
  const dbName = dbUrlObject.pathname.split('/').pop() || '';

  let dbWarning = '';
  const db = await (async () => {
    switch (client_type) {
      case 'nano': {
        const couchDBServer = nano(
          `${dbProtocol}//${db_username}:${db_password}@${dbHost}`,
        );

        return couchDBServer.db.use(dbName);
      }

      case 'pouchdb': {
        console.log('Using PouchDB');
        PouchDB.plugin(require('pouchdb-authentication'));
        PouchDB.plugin(require('pouchdb-find'));

        const remoteDB = new PouchDB(db_uri, {
          skip_setup: true,
          auth: {
            username: db_username,
            password: db_password,
          },
        });

        await (remoteDB as any).logIn(db_username, db_password);
        return remoteDB;
      }

      case 'pouchdb-websql': {
        console.log('Using PouchDB with WebSQL');
        PouchDB.plugin(require('pouchdb-authentication'));
        PouchDB.plugin(require('pouchdb-find'));
        var openDatabase = require('websql');
        const SQLiteAdapter =
          require('pouchdb-adapter-react-native-sqlite/lib')({
            openDatabase,
          });
        PouchDB.plugin(SQLiteAdapter);

        const remoteDB = new PouchDB(db_uri, {
          skip_setup: true,
          auth: {
            username: db_username,
            password: db_password,
          },
        });

        await (remoteDB as any).logIn(db_username, db_password);

        const pouchdbMd5 = require('pouchdb-md5');
        const localDbName = `.repl_temp_dbs/pouchdb-websql-${pouchdbMd5
          .stringMd5(db_uri)
          .slice(0, 8)}`;
        const localDB = new PouchDB(localDbName, {
          adapter: 'react-native-sqlite',
        });

        await new Promise<void>(resolve => {
          const initialSyncHandler = localDB.sync(remoteDB, {
            live: false,
            batch_size: 100,
            retry: true,
          });
          let lastOutputAt = 0;
          initialSyncHandler.on('change', function (info) {
            const now = Date.now();
            const pending = (info.change as any)?.pending;
            if (
              (now - lastOutputAt > 2000 || pending === 0) &&
              info.direction === 'pull'
            ) {
              console.log(`Initial sync in progress, pending: ${pending}`);
              lastOutputAt = now;
            }
          });
          initialSyncHandler.on('complete', () => {
            resolve();
          });
        });

        localDB.sync(remoteDB, {
          live: true,
          batch_size: 10,
          retry: true,
        });
        dbWarning = `WARNING: You are using a temporary local database ("${localDbName}") which syncs to your remote database. However, synchronization is not guaranteed and may be affected by network connectivity.`;

        return localDB;
      }

      default:
        throw new Error(`Invalid client_type: ${client_type}.`);
    }
  })();

  try {
    await (db as any).get('0000-config');
  } catch (e) {
    if (e instanceof Error && e.message === 'missing') {
      console.warn(
        `Warning: Cannot find Inventory config in database "${dbName}"`,
      );
    } else if (e instanceof Error) {
      console.error(`Error connecting to database: ${e.message}`);
      process.exit(1);
    } else {
      throw e;
    }
  }

  let r: repl.REPLServer | undefined;
  let logLevels = [
    'info',
    'log',
    'warn',
    'error',
    ...(options.debug ? ['debug'] : []),
  ];
  const getLogLevels = () => logLevels;
  const setLogLevels = (levels: Array<string>) => (logLevels = levels);
  const d = new CouchDBData({
    db: db as any,
    dbType: client_type,
    logger: console,
    logLevels: getLogLevels,
  });
  const context = {
    getREPL: () => r,
    db,
    getDatumFromDoc,
    getDocFromDatum,
    ...d,
    getLogLevels,
    setLogLevels,
  };
  Object.assign(global, context);

  console.log('');
  console.log('Welcome to Inventory CouchDB Data REPL.');
  console.log('');
  console.log(
    `You have the following objects and functions prepared and ready to use: ${Object.entries(
      context,
    )
      .filter(([_, v]) => typeof v === 'object' || typeof v === 'function')
      .map(([k]) => k)
      .join(', ')}.`,
  );
  console.log('');
  console.log('To exit, press Ctrl+C twice, or type .exit');
  console.log('');

  if (dbWarning) {
    console.log('');
    console.log(dbWarning);
    console.log('');
  }

  r = repl.start();

  if (Array.isArray((r as any).history)) {
    fs.promises
      .readFile(historyFilePath, 'utf8')
      .then(data => {
        const loadedHistory = data
          .split('\n')
          .reverse()
          .filter(line => !!line);
        (r as any).history.unshift(...loadedHistory);
      })
      .catch(err =>
        console.error(`Failed to read REPL history: ${err.message}`),
      );
  }

  const historyStream = fs.createWriteStream(historyFilePath, { flags: 'a' });

  r.on('line', line => {
    if (line) {
      // Skip empty lines
      historyStream.write(`${line}\n`);
    }
  });

  r?.on('exit', () => {
    historyStream.end();
  });
});
