import { v4 as uuid } from 'uuid';

import getCallbacks from '../callbacks';
import schema, { DataTypeName } from '../schema';
import {
  DataMeta,
  GetConfig,
  GetData,
  GetDatum,
  GetRelated,
  SaveDatum,
} from '../types';
import getValidation, { getErrorFromValidationResults } from '../validation';

export default function getSaveDatum({
  getConfig,
  getDatum,
  getData,
  getRelated,
  writeDatum,
  deleteDatum,
}: {
  getConfig: GetConfig;
  getDatum: GetDatum;
  getData: GetData;
  getRelated: GetRelated;
  writeDatum: (
    d: DataMeta<DataTypeName> & { [key: string]: unknown },
  ) => Promise<void>;
  deleteDatum: (
    d: DataMeta<DataTypeName> & { [key: string]: unknown },
  ) => Promise<void>;
}): SaveDatum {
  const { beforeSave } = getCallbacks({
    getConfig,
    getDatum,
    getData,
    getRelated,
  });

  const { validate, validateDelete } = getValidation({
    getConfig,
    getDatum,
    getData,
    getRelated,
  });

  const saveDatum: SaveDatum = async <T extends DataTypeName>(
    d: DataMeta<T> & { [key: string]: unknown },
    options: { noTouch?: boolean; ignoreConflict?: boolean } = {},
  ) => {
    const existingData = await (async () => {
      if (typeof d.__id !== 'string') return null;

      return await getDatum(d.__type, d.__id);
    })();

    const dataToSave: DataMeta<T> & { [key: string]: unknown } = {
      ...(existingData
        ? (Object.fromEntries(
            Object.entries(existingData).filter(
              ([k]) => k !== '__rev' && k !== '__type',
            ),
          ) as any)
        : {}),
      ...d,
      ...(options.ignoreConflict && existingData?.__rev
        ? { __rev: existingData.__rev }
        : {}),
    };

    if (typeof dataToSave.__created_at !== 'number') {
      dataToSave.__created_at = new Date().getTime();
    }

    if (!options.noTouch || typeof dataToSave.__updated_at !== 'number') {
      dataToSave.__updated_at = new Date().getTime();
    }

    await beforeSave(dataToSave);

    const s = schema[d.__type];

    if (!dataToSave.__deleted) {
      // Save
      if (typeof dataToSave.__id !== 'string') {
        dataToSave.__id = uuid();
      }
      s.parse(dataToSave);
      const validationResults = await validate(dataToSave);
      const validationError = getErrorFromValidationResults(validationResults);
      if (validationError) throw validationError;
      await writeDatum(dataToSave);
    } else {
      // Delete
      if (typeof dataToSave.__id !== 'string') {
        throw new Error('__id must be specified while setting __deleted: true');
      }
      const validationResults = await validateDelete({
        ...dataToSave,
        __id: dataToSave.__id,
        __deleted: true,
      });
      const validationError = getErrorFromValidationResults(validationResults);
      if (validationError) throw validationError;
      await deleteDatum(dataToSave);
    }

    return dataToSave;
  };

  return saveDatum;
}
