import appLogger from '@app/logger';

import { DataTypeName } from '../../schema';
import {
  DataTypeWithAdditionalInfo,
  InvalidDataTypeWithAdditionalInfo,
} from '../../types';
import { mockData } from '../setMockData';

export default async function getDatum<T extends DataTypeName>(
  type: T,
  id: string,
  {
    db,
    logger,
  }: {
    db: PouchDB.Database;
    logger: typeof appLogger;
  },
): Promise<
  DataTypeWithAdditionalInfo<T> | InvalidDataTypeWithAdditionalInfo<T>
> {
  return mockData[type]?.find((d: any) => d.__id === id);
}
