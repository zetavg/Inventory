#!/usr/bin/env -S npx ts-node --transpile-only -r tsconfig-paths/register

import PouchDB from 'pouchdb';
import nano from 'nano';
import { program } from 'commander';

import fs from 'fs';
import CouchDBData from 'lib/CouchDBData';
import { getDatumFromDoc, getDocFromDatum } from 'lib/functions/couchdb-utils';
import path from 'path';
import prompt from 'prompt';
import repl from 'repl';

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
    'Client type, either "nano" or "pouchdb".',
    value => {
      const validValues = ['nano', 'pouchdb'];
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
  );

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
  let logLevels = ['info', 'log', 'warn', 'error'];
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