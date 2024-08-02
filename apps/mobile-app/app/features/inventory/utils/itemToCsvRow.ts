import dataItemToCsvRow from '@invt/data/utils/csv/itemToCsvRow';

import appLogger from '@app/logger';

import { DataTypeWithID } from '@app/data';
import { getGetDatum } from '@app/data/functions';

export default async function itemToCsvRow(
  item: DataTypeWithID<'item'>,
  {
    db,
    loadedCollectionsMap,
  }: {
    db: PouchDB.Database;
    loadedCollectionsMap: Map<string, DataTypeWithID<'collection'>>;
  },
) {
  const logger = appLogger.for({ module: 'itemToCsvRow' });

  const getDatum = getGetDatum({ db, logger });
  return dataItemToCsvRow(item, {
    getDatum,
    loadedCollectionsMap,
  });
}
