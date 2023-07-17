import { useCallback } from 'react';

import { v4 as uuid } from 'uuid';
import { ZodError } from 'zod';

import { useDB } from '@app/db';

import useLogger from '@app/hooks/useLogger';

import { beforeSave } from '../callbacks';
import { getDatumFromDoc } from '../pouchdb-utils';
import schema, { DataType, DataTypeName } from '../schema';
import { validate, validateDelete } from '../validation';

type SaveFn = <T extends DataTypeName>(
  d: Partial<DataType<T>> & {
    __type: T;
    __id?: string;
    __rev?: string;
    __deleted?: boolean;
  },
) => Promise<{ type: DataTypeName; id: string } | null>;

function useSave(): SaveFn {
  const logger = useLogger('useSave');
  const { db } = useDB();

  return useCallback<SaveFn>(
    async d => {
      let { __type, __id, __rev, __deleted, ...pureData } = d;
      const s = schema[__type];

      let existingDoc = {};
      try {
        if (!db) throw new Error('Database is not ready yet.');
        if (__id) {
          const eDoc = await db.get(`${__type}-${__id}`).catch(function (_e) {
            return null;
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
          logger,
          { validate: false },
        );

        if (!updateDocProxy) throw new Error('updateDocProxy is null');

        await beforeSave(updateDocProxy, { db });

        // Validation
        // (Do not need to validate if we are going to delete the document.)
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
          const issues = await validateDelete(
            { __type, __id, __deleted },
            { db },
          );
          if (issues.length > 0) {
            throw new ZodError(issues);
          }
        }

        const response = await db.put(updateDoc);
        const [type, ...idParts] = response.id.split('-');
        const id = idParts.join('-');
        return { type: type as any, id };
      } catch (e) {
        if (e instanceof ZodError) {
          throw e;
        }

        logger.error(e, {
          showAlert: true,
          details: JSON.stringify({ data: d, existingDoc }, null, 2),
        });
        return null;
      }
    },
    [db, logger],
  );
}

export default useSave;
