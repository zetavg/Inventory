import appLogger from '@app/logger';

import getCallbacks from '@app/data/callbacks';
import { getGetConfig } from '@app/data/functions/config';
import { getGetData } from '@app/data/functions/getData';
import { getGetDatum } from '@app/data/functions/getDatum';
import { getGetRelated } from '@app/data/functions/getRelated';
import {
  DataTypeWithAdditionalInfo,
  InvalidDataTypeWithAdditionalInfo,
} from '@app/data/types';
import getValidation, { ValidationResults } from '@app/data/validation';

import csvRowToItem from './csvRowToItem';

export async function getItemsFromCsv(
  csvData: unknown,
  { db }: { db: PouchDB.Database },
) {
  if (!Array.isArray(csvData)) {
    throw new Error(`csvData is not an array (is ${typeof csvData})`);
  }
  const csvRows = csvData.filter((r: any) => !!r.Name);
  const loadedRefNoCollectionsMap = new Map();

  const items = await Promise.all(
    csvRows.map((r: any) => csvRowToItem(r, { db, loadedRefNoCollectionsMap })),
  );

  return items;
}

export async function processItems(
  items: Array<
    | DataTypeWithAdditionalInfo<'item'>
    | InvalidDataTypeWithAdditionalInfo<'item'>
  > | null,
  { db }: { db: PouchDB.Database },
) {
  const logger = appLogger.for({
    module: 'csv-import',
    function: 'processItems',
  });

  const getConfig = getGetConfig({ db });
  const getDatum = getGetDatum({ db, logger });
  const getData = getGetData({ db, logger });
  const getRelated = getGetRelated({ db, logger });

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

  const processedItems = await Promise.all(
    (items || []).map(async it => {
      await beforeSave(it);
      return it;
    }),
  );
  const issuesMap = new WeakMap();
  await Promise.all(
    processedItems.map(async it => {
      const issues = await validate(it);
      if (issues && issues.length > 0) {
        issuesMap.set(it, issues);
      }
    }),
  );

  return { processedItems, issuesMap };
}

export function classifyItems(
  items: Array<
    | DataTypeWithAdditionalInfo<'item'>
    | InvalidDataTypeWithAdditionalInfo<'item'>
  > | null,
  {
    itemIssues,
  }: {
    itemIssues: WeakMap<
      | DataTypeWithAdditionalInfo<'item'>
      | InvalidDataTypeWithAdditionalInfo<'item'>,
      ValidationResults
    >;
  },
) {
  const validItems: Array<DataTypeWithAdditionalInfo<'item'>> = [];
  const invalidItems: Array<
    | DataTypeWithAdditionalInfo<'item'>
    | InvalidDataTypeWithAdditionalInfo<'item'>
  > = [];

  const itemsToCreate: Array<DataTypeWithAdditionalInfo<'item'>> = [];
  const itemsToUpdate: Array<DataTypeWithAdditionalInfo<'item'>> = [];

  for (const item of items || []) {
    if (item) {
      if (item.__valid && !itemIssues.has(item)) {
        validItems.push(item);
        if (typeof item.__created_at === 'number') {
          itemsToUpdate.push(item);
        } else {
          itemsToCreate.push(item);
        }
      } else {
        invalidItems.push(item);
      }
    }
  }

  return {
    validItems,
    invalidItems,
    itemsToCreate,
    itemsToUpdate,
  };
}
