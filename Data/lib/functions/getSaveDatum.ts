import { v4 as uuid } from 'uuid';

import getCallbacks from '../callbacks';
import schema, { DataType, DataTypeName } from '../schema';
import {
  DataMeta,
  GetAllAttachmentInfoFromDatum,
  GetConfig,
  GetData,
  GetDatum,
  GetRelated,
  InvalidDataTypeWithID,
  SaveDatum,
  ValidDataTypeWithID,
} from '../types';
import { hasChanges } from '../utils';
import { getValidationErrorFromZodSafeParseReturnValue } from '../utils/validation-utils';
import getValidation, { getErrorFromValidationResults } from '../validation';

export default function getSaveDatum({
  getConfig,
  getDatum,
  getData,
  getRelated,
  getAllAttachmentInfoFromDatum,
  validateAttachments,
  writeDatum,
  deleteDatum,
  skipSaveCallback,
}: {
  getConfig: GetConfig;
  getDatum: GetDatum;
  getData: GetData;
  getRelated: GetRelated;
  getAllAttachmentInfoFromDatum: GetAllAttachmentInfoFromDatum;
  validateAttachments: (
    d: DataMeta<DataTypeName> & { [key: string]: unknown },
  ) => Promise<Error | null>;
  writeDatum: (
    d: DataMeta<DataTypeName> & { [key: string]: unknown },
    origData:
      | ValidDataTypeWithID<DataTypeName>
      | InvalidDataTypeWithID<DataTypeName>
      | null,
  ) => Promise<DataMeta<DataTypeName> & { [key: string]: unknown }>;
  deleteDatum: (
    d: DataMeta<DataTypeName> & { [key: string]: unknown },
  ) => Promise<void>;
  skipSaveCallback?: (existingData: unknown, dataToSave: unknown) => void;
}): SaveDatum {
  const saveDatum: SaveDatum = async <T extends DataTypeName>(
    d:
      | (DataMeta<T> & { [key: string]: unknown })
      | [
          T,
          string,
          (
            d: Readonly<DataMeta<T> & { [key: string]: unknown }>,
          ) => Partial<DataType<T>>,
        ],
    options: {
      noTouch?: boolean;
      forceTouch?: boolean;
      ignoreConflict?: boolean;
      skipValidation?: boolean;
      skipCallbacks?: boolean;
    } = {},
  ) => {
    /** A reusable function that run callbacks, do validation and save the provided data. */
    const doSaveData = async (
      existingData: ValidDataTypeWithID<T> | InvalidDataTypeWithID<T> | null,
      dataToSave: DataMeta<T> & { [key: string]: unknown },
    ) => {
      if (typeof dataToSave.__created_at !== 'number') {
        dataToSave.__created_at = new Date().getTime();
      }

      if (typeof dataToSave.__updated_at !== 'number') {
        dataToSave.__updated_at = new Date().getTime();
      }

      const s = schema[dataToSave.__type];

      if (!options.skipCallbacks) {
        await beforeSave(dataToSave);
      }

      if (!dataToSave.__deleted) {
        // Save
        if (typeof dataToSave.__id !== 'string') {
          dataToSave.__id = uuid();
        }

        if (!options.skipValidation) {
          const safeParseResults = s.safeParse(dataToSave);
          const safeParseError =
            getValidationErrorFromZodSafeParseReturnValue(safeParseResults);
          if (safeParseError) throw safeParseError;

          const validationResults = await validate(dataToSave);
          const validationError =
            getErrorFromValidationResults(validationResults);
          if (validationError) throw validationError;

          const attachmentsError = await validateAttachments(dataToSave);
          if (attachmentsError) throw attachmentsError;
        }

        const changeLevel = existingData
          ? hasChanges(existingData, dataToSave)
          : 11;

        if (
          existingData &&
          !hasChanges(existingData, dataToSave) &&
          !options.forceTouch
        ) {
          // Data has not been changed, skip saving
          if (skipSaveCallback) skipSaveCallback(existingData, dataToSave);
          return dataToSave;
        }

        if (!options.noTouch && (options.forceTouch || changeLevel > 10)) {
          dataToSave.__updated_at = new Date().getTime();
        }

        const newData = await writeDatum(dataToSave, existingData);
        dataToSave = {
          ...dataToSave,
          ...(newData as any),
        };
      } else {
        // Delete
        if (typeof dataToSave.__id !== 'string') {
          throw new Error(
            '__id must be specified while setting __deleted: true',
          );
        }

        if (!options.skipValidation) {
          const validationResults = await validateDelete({
            ...dataToSave,
            __id: dataToSave.__id,
            __deleted: true,
          });
          const validationError =
            getErrorFromValidationResults(validationResults);
          if (validationError) throw validationError;
        }

        await deleteDatum(dataToSave);
      }

      if (!options.skipCallbacks) {
        await afterSave(dataToSave);
      }

      return dataToSave;
    };

    // Using a updater function
    if (Array.isArray(d)) {
      if (options.ignoreConflict === false) {
        throw new Error(
          'Setting ignoreConflict to false does not make sense while using an updater function.',
        );
      }

      const [type, id, updater] = d;
      const errors: unknown[] = [];
      while (true) {
        try {
          const existingData = await getDatum(type, id);
          if (!existingData) throw new Error(`Data not found: ${type} ${id}`);

          const updatedData = updater(existingData);
          const dataToSave: DataMeta<T> & { [key: string]: unknown } = {
            ...(existingData
              ? (Object.fromEntries(
                  Object.entries(existingData).filter(
                    ([k]) => k !== '__rev' && k !== '__type',
                  ),
                ) as any)
              : {}),
            ...updatedData,
            __type: type,
            __rev: existingData.__rev,
            ...(updatedData.__raw ? { __raw: updatedData.__raw } : {}),
          };

          return await doSaveData(existingData, dataToSave);
        } catch (e) {
          if (errors.length > 24) {
            if (
              e &&
              typeof e === 'object' &&
              typeof (e as any).message === 'string'
            ) {
              (e as any).message +=
                '\n\nprevious errors:\n' + errors.join('\n');
            }

            throw e;
          }

          errors.push(e);
        }
      }
    }

    // Normal save
    if (true /* an unnecessary if condition for code folding in editors */) {
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
        ...(d.__raw ? { __raw: d.__raw } : {}),
      };

      return await doSaveData(existingData, dataToSave);
    }
  };

  const { beforeSave, afterSave } = getCallbacks({
    getConfig,
    getDatum,
    getData,
    getRelated,
    getAllAttachmentInfoFromDatum,
    saveDatum,
  });

  const { validate, validateDelete } = getValidation({
    getConfig,
    getDatum,
    getData,
    getRelated,
  });

  return saveDatum;
}
