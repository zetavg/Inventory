import { beforeSave } from '@app/data/callbacks';
import {
  DataTypeWithAdditionalInfo,
  InvalidDataTypeWithAdditionalInfo,
} from '@app/data/types';
import { validate, ValidationResults } from '@app/data/validation';

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
  const processedItems = await Promise.all(
    (items || []).map(async it => {
      await beforeSave(it, { db });
      return it;
    }),
  );
  const issuesMap = new WeakMap();
  await Promise.all(
    processedItems.map(async it => {
      const issues = await validate(it, { db });
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
