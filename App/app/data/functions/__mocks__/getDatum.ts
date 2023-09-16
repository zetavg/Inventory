import appLogger from '@app/logger';

import { DataTypeName } from '../../schema';
import {
  DataTypeWithAdditionalInfo,
  GetDatum,
  InvalidDataTypeWithAdditionalInfo,
} from '../../types';
import { mockData } from '../setMockData';

export function getGetDatum(_context: {
  db: PouchDB.Database;
  logger: typeof appLogger;
}): GetDatum {
  const getDatum: GetDatum = async function getDatum(type, id) {
    return mockData[type]?.find((d: any) => d.__id === id);
  };

  return getDatum;
}

export default async function getDatumLegacy<T extends DataTypeName>(
  type: T,
  id: string,
  context: {
    db: PouchDB.Database;
    logger: typeof appLogger;
  },
): Promise<
  DataTypeWithAdditionalInfo<T> | InvalidDataTypeWithAdditionalInfo<T> | null
> {
  return await getGetDatum(context)(type, id);
}
