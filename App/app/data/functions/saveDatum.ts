import { v4 as uuid } from 'uuid';
import { ZodError } from 'zod';

import appLogger from '@app/logger';

import { beforeSave } from '../callbacks';
import { getDataIdFromPouchDbId, getDatumFromDoc } from '../pouchdb-utils';
import schema, { DataTypeName } from '../schema';
import { DataTypeWithAdditionalInfo } from '../types';
import { validate, validateDelete } from '../validation';

export default async function saveDatum<T extends DataTypeName>(
  d: Partial<DataTypeWithAdditionalInfo<T>>,
  {
    db,
    logger,
  }: {
    db: PouchDB.Database;
    logger: typeof appLogger;
  },
): Promise<DataTypeWithAdditionalInfo<T>> {
  let {
    __type,
    __id,
    __rev,
    __deleted,
    __created_at,
    __updated_at,
    ...unfilteredPureData
  } = d;
  if (!__type)
    throw new Error(`Cannot get __type from object ${JSON.stringify(d)}.`);

  const s = schema[__type];
  const pureData: typeof unfilteredPureData = Object.fromEntries(
    Object.entries(unfilteredPureData).filter(([k]) => !k.startsWith('__')),
  ) as any;

  let existingDoc = {};
  if (__id) {
    const eDoc = await db.get(`${__type}-${__id}`).catch(function (e) {
      if (e instanceof Error && e.name === 'not_found') {
        return null;
      }

      throw e;
    });
    if (eDoc) {
      existingDoc = eDoc;
    }
  }

  const updateDoc: Record<string, unknown> = {
    ...existingDoc,
    data: pureData,
  };

  if (__id) {
    updateDoc._id = `${__type}-${__id}`;
  }

  if (__rev) {
    updateDoc._rev = __rev;
  }

  if (__deleted) {
    updateDoc._deleted = __deleted;
  }

  if (!updateDoc._id) {
    // TODO: Ensure the ID is unique.
    updateDoc._id = `${__type}-${uuid()}`;
  }

  if (!updateDoc.created_at) {
    updateDoc.created_at = new Date().getTime();
  }

  updateDoc.updated_at = new Date().getTime();

  const updateDocProxy = getDatumFromDoc(
    __type,
    updateDoc as any,
    logger.off(), // No need to log validation errors
  );

  await beforeSave(updateDocProxy, { db });

  // Validation
  if (!__deleted) {
    let zodError: ZodError | undefined;
    try {
      s.parse(updateDocProxy);
    } catch (e) {
      if (e instanceof ZodError) {
        zodError = e;
      } else {
        throw e;
      }
    }

    const issues = await validate(updateDocProxy, { db });
    if (issues.length > 0) {
      if (!zodError) {
        zodError = new ZodError(issues);
      } else {
        zodError.issues = [...zodError.issues, ...issues];
      }
    }

    if (zodError) {
      throw zodError;
    }
  } else {
    const issues = await validateDelete({ __type, __id, __deleted }, { db });
    if (issues.length > 0) {
      throw new ZodError(issues);
    }
  }

  updateDoc.type = d.__type;

  const _response = await db.put(updateDoc);
  return getDatumFromDoc(__type, updateDoc as any, logger) as any;
}