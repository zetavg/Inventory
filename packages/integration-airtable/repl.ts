#!/usr/bin/env -S npx ts-node --transpile-only
import { program } from 'commander';
import fetch from 'node-fetch';

import fs from 'fs';
import path from 'path';
import repl from 'repl';

import AirtableAPI, { AirtableAPIError } from './lib/AirtableAPI';
import createInventoryBase from './lib/createInventoryBase';

program.description('Inventory Airtable Integration REPL.');

program.parse(process.argv);

const options = program.opts();

const historyFilePath = path.join(__dirname, '.repl_history');

(global as any).Err = Error; // in the REPL, Error will not be the same as it is here, so we assign it to a global variable so that we can use it in the REPL

const { _ } = options;

let r: repl.REPLServer | undefined;

const context = {
  getREPL: () => r,
  fetch,
  AirtableAPI,
  AirtableAPIError,
  createInventoryBase,
};
Object.assign(global, context);

console.log('');
console.log('Welcome to Inventory Airtable Integration REPL.');
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
    .catch(err => console.error(`Failed to read REPL history: ${err.message}`));
}

const historyStream = fs.createWriteStream(historyFilePath, { flags: 'a' });

r.on('line', line => {
  if (line) {
    // Skip empty lines
    historyStream.write(`${line}\n`);
  }
});

r.on('exit', () => {
  historyStream.end();
});
