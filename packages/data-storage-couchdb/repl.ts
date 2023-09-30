#!/usr/bin/env -S npx ts-node -r tsconfig-paths/register

import nano from 'nano';
import { program } from 'commander';

import CouchDBData from 'lib/CouchDBData';
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
  );

program.parse(process.argv);

const options = program.opts();

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
  const { db_uri, db_username, db_password } = options;
  const dbUrlObject = new URL(db_uri);
  const dbProtocol = dbUrlObject.protocol;
  const dbHost = dbUrlObject.host;
  const dbName = dbUrlObject.pathname.split('/').pop() || '';

  const couchDBServer = nano(
    `${dbProtocol}//${db_username}:${db_password}@${dbHost}`,
  );

  const db = couchDBServer.db.use(dbName);

  try {
    await db.get('0000-config');
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
  const d = new CouchDBData({ db });

  const context = {
    couchDBServer,
    db,
    ...d,
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

  repl.start();
});
