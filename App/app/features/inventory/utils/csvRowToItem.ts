import dataCsvRowToItem from '@deps/data/utils/csv/csvRowToItem';

import appLogger from '@app/logger';

import { getGetConfig, getGetData, getGetDatum } from '@app/data/functions';
import { InvalidDataTypeWithID, ValidDataTypeWithID } from '@app/data/types';

export default async function csvRowToItem(
  csvRow: Record<string, string>,
  {
    db,
    loadedRefNoCollectionsMap,
  }: {
    db: PouchDB.Database;
    loadedRefNoCollectionsMap: Map<string, ValidDataTypeWithID<'collection'>>;
  },
): Promise<ValidDataTypeWithID<'item'> | InvalidDataTypeWithID<'item'>> {
  const logger = appLogger.for({ module: 'csvRowToItem' });

  const getConfig = getGetConfig({ db, logger });
  const getDatum = getGetDatum({ db, logger });
  const getData = getGetData({ db, logger });
  return dataCsvRowToItem(csvRow, {
    getConfig,
    getDatum,
    getData,
    loadedRefNoCollectionsMap,
  });
}
