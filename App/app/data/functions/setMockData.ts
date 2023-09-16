import logger from '@app/logger';

import getCallbacks from '../callbacks';
import { DataTypeName } from '../schema';
import {
  DataTypeWithAdditionalInfo,
  InvalidDataTypeWithAdditionalInfo,
} from '../types';

import { getGetConfig } from './config';
import { getGetData } from './getData';
import { getGetDatum } from './getDatum';
import { getGetRelated } from './getRelated';

export const mockData: any = {};

export default async function setMockData<T extends DataTypeName>(
  type: T,
  d: Array<
    DataTypeWithAdditionalInfo<T> | InvalidDataTypeWithAdditionalInfo<T>
  >,
) {
  const getConfig = getGetConfig({ db: {} as any });
  const getDatum = getGetDatum({ db: {} as any, logger: logger.off() });
  const getData = getGetData({ db: {} as any, logger: logger.off() });
  const getRelated = getGetRelated({ db: {} as any, logger: logger.off() });

  const { beforeSave } = getCallbacks({
    getConfig,
    getDatum,
    getData,
    getRelated,
  });

  mockData[type] = await Promise.all(
    d.map(async dt => {
      await beforeSave(dt);
      return dt;
    }),
  );
}
