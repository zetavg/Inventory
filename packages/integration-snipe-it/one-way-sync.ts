/**
 * Usage: ts-node -r tsconfig-paths/register --files one-way-sync.ts --help
 */

import { v4 as uuid } from 'uuid';
import { program } from 'commander';
import nano from 'nano';
import cliProgress from 'cli-progress';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import he from 'he';
import fetch from 'node-fetch';

import getCallbacks from '@deps/data/callbacks';
import { DataTypeWithID, InvalidDataTypeWithID } from '@deps/data/types';
import getValidation from '@deps/data/validation';
import { getDocFromDatum } from '@deps/data-storage-couchdb/functions/couchdb-utils';
import getGetConfig from '@deps/data-storage-couchdb/functions/getGetConfig';
import getGetData from '@deps/data-storage-couchdb/functions/getGetData';
import getGetDatum from '@deps/data-storage-couchdb/functions/getGetDatum';
import getGetRelated from '@deps/data-storage-couchdb/functions/getGetRelated';
import EPCUtils from '@deps/epc-utils';

import fs from 'fs';
import getCategoryById from 'lib/snipe-it-client/functions/getCategoryById';
import path from 'path';
import { URL } from 'url';

import getAssetsGenerator from './lib/snipe-it-client/functions/getAssetsGenerator';
import { Context } from './lib/snipe-it-client/types';

const logFilePath = path.join(__dirname, 'log.txt');

function log(message: string) {
  fs.appendFile(logFilePath, message + '\n', () => {});
}

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

program
  .description(
    'Do a one-time, one-way sync from Snipe-IT to an Inventory CouchDB database.',
  )
  .requiredOption(
    '-s, --sync_id <uid>',
    'A unique ID to identify this sync. Using a different ID for a same sync will cause duplicated data.',
  )
  .requiredOption(
    '-a, --api_base_url <url>',
    'Snipe-IT API base URL, such as "https://<domain>/api/v1".',
  )
  .requiredOption(
    '-k, --api_key <key>',
    'Snipe-IT API key. You can also specify a file path to load it from a file.',
  )
  .requiredOption(
    '-t, --time_zone <time_zone>',
    'Snipe-IT time zone, for example, Asia/Taipei.',
  )
  .option(
    '-c, --company_id <id>',
    'Specify the company ID in Snipe-IT that you want to sync assets from. Omit this option to sync assets all companies.',
  )
  .requiredOption(
    '-d, --db_uri <uri>',
    'Database URI, e.g. http://localhost:5984/inventory.',
  )
  .requiredOption('-u, --db_username <username>', 'Database username.')
  .requiredOption(
    '-p, --db_password <password>',
    'Database password. You can also specify a file path to load it from a file.',
  );

program.parse(process.argv);

const options = program.opts();
const {
  sync_id,
  api_base_url,
  api_key,
  time_zone,
  company_id,
  db_uri,
  db_username,
  db_password,
} = options;

const dbUrlObject = new URL(db_uri);
const dbProtocol = dbUrlObject.protocol;
const dbHost = dbUrlObject.host;
const dbName = dbUrlObject.pathname.split('/').pop() || '';

const couchDBServer = nano(
  `${dbProtocol}//${db_username}:${readOptionFileIfPathIsValid(
    db_password,
    `Using database password from file: ${db_password}.`,
  )}@${dbHost}`,
);

const db = couchDBServer.db.use(dbName);

const getConfig = getGetConfig({ db });
const getDatum = getGetDatum({ db });
const getData = getGetData({ db });
const getRelated = getGetRelated({ db });

const { beforeSave } = getCallbacks({
  getConfig,
  getDatum,
  getData,
  getRelated,
});
const { validate } = getValidation({
  getConfig,
  getDatum,
  getData,
  getRelated,
});

const siCtx: Context = {
  fetch,
  baseUrl: api_base_url,
  key: readOptionFileIfPathIsValid(
    api_key,
    `Using API key from file: ${api_key}.`,
  ),
};

(async () => {
  const config = await getConfig({ ensureSaved: true });
  const usedCollectionReferenceNumbersSet = new Set(
    (await getData('collection', {}, { limit: 99999 })).map(
      c => c.collection_reference_number,
    ),
  );
  const collectionReferenceDigits = EPCUtils.getCollectionReferenceDigits({
    iarPrefix: config.rfid_tag_individual_asset_reference_prefix,
    companyPrefix: config.rfid_tag_company_prefix,
  });

  function getNewCollectionReferenceNumber() {
    let newCollectionReferenceNumber = '';
    while (
      !newCollectionReferenceNumber ||
      usedCollectionReferenceNumbersSet.has(newCollectionReferenceNumber)
    ) {
      newCollectionReferenceNumber = generateRandomRefNumber(
        collectionReferenceDigits,
      );
    }
    usedCollectionReferenceNumbersSet.add(newCollectionReferenceNumber);
    return newCollectionReferenceNumber;
  }

  const progressBar = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic,
  );
  let progressBarStarted = false;

  const companyId = (company_id && parseInt(company_id, 10)) || undefined;
  if (companyId !== undefined && isNaN(companyId)) {
    throw new Error(`Invalid company ID: ${company_id}`);
  }

  const collectionMap = new Map<
    number,
    DataTypeWithID<'collection'> | InvalidDataTypeWithID<'collection'>
  >();
  async function getOrCreateCollection({
    name,
    id,
  }: {
    name: string;
    id: number;
  }) {
    if (collectionMap.has(id)) {
      return collectionMap.get(id)!;
    }

    const category = await getCategoryById(siCtx, id);
    const categoryCreatedAt = dayjs
      .tz(category?.created_at?.datetime, 'YYYY-MM-DD HH:mm:ss', time_zone)
      .toDate()
      .getTime();
    const categoryUpdatedAt = dayjs
      .tz(category?.created_at?.datetime, 'YYYY-MM-DD HH:mm:ss', time_zone)
      .toDate()
      .getTime();

    const existingCollection = await (async () => {
      const collectionBySnipeId = (
        await getData(
          'collection',
          { integrations: { 'snipe-it': { [sync_id]: { id } } } },
          { limit: 1 },
        )
      )[0];
      if (collectionBySnipeId) {
        return collectionBySnipeId;
      }

      const collectionByName = (
        await getData('collection', { name }, { limit: 1 })
      )[0];
      if (collectionByName) {
        const sid = (collectionByName.integrations as any)?.['snipe-it']?.[
          sync_id
        ];

        if (!sid) {
          log(
            `Associating name-matching collection "${collectionByName.name}" (${collectionByName.__id}) with Snipe-IT category ${id}.`,
          );
          if (!collectionByName.integrations)
            collectionByName.integrations = {};
          if (!(collectionByName.integrations as any)['snipe-it']) {
            (collectionByName.integrations as any)['snipe-it'] = {};
          }
          if (!(collectionByName.integrations as any)['snipe-it'][sync_id]) {
            (collectionByName.integrations as any)['snipe-it'][sync_id] = {};
          }
          (collectionByName.integrations as any)['snipe-it'][sync_id].id = id;
          const doc = getDocFromDatum(collectionByName);
          await db.insert(doc);
          return collectionByName;
        }

        if (sid === id) {
          return collectionByName;
        }
      }
    })();

    if (existingCollection) {
      if (
        typeof existingCollection.__updated_at !== 'number' ||
        existingCollection.__updated_at < categoryUpdatedAt ||
        true /* TODO */
      ) {
        log(
          `Updating existing collection "${existingCollection.name}" (${existingCollection.__id})`,
        );
        existingCollection.name = he.decode(name);
        existingCollection.__updated_at = categoryUpdatedAt;

        await beforeSave(existingCollection);
        const validationResults = await validate(existingCollection);
        if (validationResults.length > 0) {
          throw new Error(
            `Invalid collection ${existingCollection.__id}: ${JSON.stringify(
              validationResults,
            )}`,
          );
        }

        const doc = getDocFromDatum(existingCollection);
        await db.insert(doc);
      }

      collectionMap.set(id, existingCollection);
      return existingCollection;
    }

    const newCollection: DataTypeWithID<'collection'> = {
      __type: 'collection',
      __id: uuid(),
      name: he.decode(name),
      collection_reference_number: getNewCollectionReferenceNumber(),
      icon_name: 'box',
      icon_color: 'gray',
      config_uuid: config.uuid,
      integrations: {
        'snipe-it': {
          [sync_id]: { id },
        },
      },
      __created_at: categoryCreatedAt,
      __updated_at: categoryUpdatedAt,
      __valid: true,
    };
    log(
      `Creating new collection "${newCollection.name}" for Snipe-IT category ${id}.`,
    );

    await beforeSave(newCollection);
    const validationResults = await validate(newCollection);
    if (validationResults.length > 0) {
      throw new Error(
        `Invalid new collection: ${JSON.stringify(validationResults)}`,
      );
    }

    const doc = getDocFromDatum(newCollection);
    await db.insert(doc);

    collectionMap.set(id, newCollection);
    return newCollection;
  }

  for await (const { total, current, asset } of getAssetsGenerator(
    siCtx,
    companyId,
  )) {
    if (!progressBarStarted) {
      progressBar.start(total, 0);
      progressBarStarted = true;
    }

    try {
      const collection = await getOrCreateCollection(asset.category);

      const itemNameFromAsset = he.decode(
        asset.name || `${asset.model.name} #${asset.asset_tag}`,
      );
      const assetCreatedAt = dayjs
        .tz(asset?.created_at?.datetime, 'YYYY-MM-DD HH:mm:ss', time_zone)
        .toDate()
        .getTime();
      const assetUpdatedAt = dayjs
        .tz(asset?.created_at?.datetime, 'YYYY-MM-DD HH:mm:ss', time_zone)
        .toDate()
        .getTime();

      const existingItem = (
        await getData(
          'item',
          { integrations: { 'snipe-it': { [sync_id]: { id: asset.id } } } },
          { limit: 1 },
        )
      )[0];
      if (existingItem) {
        if (
          typeof existingItem.__updated_at !== 'number' ||
          existingItem.__updated_at < assetUpdatedAt ||
          true /* TODO: We need to update the asset if the asset's model has been changed */
        ) {
          log(
            `Updating existing item "${existingItem.name}" (${existingItem.__id})`,
          );
          existingItem.name = itemNameFromAsset;
          existingItem.collection_id = collection.__id;
          existingItem.model_name = he.decode(asset.model.name);
          existingItem.__updated_at = assetUpdatedAt;

          await beforeSave(existingItem);
          const validationResults = await validate(existingItem);
          if (validationResults.length > 0) {
            throw new Error(
              `Invalid item ${existingItem.__id}: ${JSON.stringify(
                validationResults,
              )}`,
            );
          }

          const doc = getDocFromDatum(existingItem);
          await db.insert(doc);
        }
      } else {
        const newItem: DataTypeWithID<'item'> = {
          __type: 'item',
          __id: uuid(),
          collection_id: collection.__id || '',
          name: itemNameFromAsset,
          icon_name:
            (typeof collection.item_default_icon_name === 'string'
              ? collection.item_default_icon_name
              : undefined) || 'cube-outline',
          icon_color: 'gray',
          model_name: he.decode(asset.model.name),
          config_uuid: config.uuid,
          integrations: {
            'snipe-it': {
              [sync_id]: { id: asset.id },
            },
          },
          __created_at: assetCreatedAt,
          __updated_at: assetUpdatedAt,
          __valid: true,
        };
        log(
          `Creating new item "${newItem.name}" for Snipe-IT asset ${asset.id}.`,
        );

        await beforeSave(newItem);
        const validationResults = await validate(newItem);
        if (validationResults.length > 0) {
          throw new Error(
            `Invalid new item: ${JSON.stringify(validationResults)}`,
          );
        }

        const doc = getDocFromDatum(newItem);
        await db.insert(doc);
      }
    } catch (e) {
      log(`ERROR: ${e instanceof Error ? e.message : 'unknown error'}`);
    }

    progressBar.update(current);
  }

  progressBar.stop();

  console.log(`Done. See ${logFilePath} for logs.`);
})();

function generateRandomRefNumber(digits: number) {
  return Array.from({ length: digits }, () =>
    Math.floor(Math.random() * 10),
  ).join('');
}

function readOptionFileIfPathIsValid(
  possibleFilePath: string,
  successMessage: string,
) {
  try {
    const stats = fs.statSync(possibleFilePath);
    if (stats.isFile()) {
      const content = fs.readFileSync(possibleFilePath, 'utf8');
      console.log(successMessage);
      return content.trim();
    }
  } catch (error) {}

  return possibleFilePath;
}
