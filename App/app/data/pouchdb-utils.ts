import useLogger from '@app/hooks/useLogger';

import schema, { DATA_TYPE_NAMES, DataTypeName } from './schema';
import { DataTypeWithAdditionalInfo } from './types';

export function getPouchDbId(type: DataTypeName, id: string) {
  return `${type}-${id}`;
}

export function getDataIdFromPouchDbId(id: string): {
  type: DataTypeName;
  id: string;
} {
  const [type, ...idParts] = id.split('-');
  if (!DATA_TYPE_NAMES.includes(type as any)) {
    throw new Error(
      `getDataIdFromPouchDbId: type "${type}" is unknown (${id})`,
    );
  }
  return {
    type: type as any,
    id: idParts.join('-'),
  };
}

export function getTypeIdStartAndEndKey(type: DataTypeName): [string, string] {
  const idStartKey = `${type}-`;
  const idEndKey = idStartKey + '\uffff';
  return [idStartKey, idEndKey];
}

export function getDataTypeSelector(
  type: DataTypeName,
): PouchDB.Find.FindRequest<{}>['selector'] {
  const [idStartKey, idEndKey] = getTypeIdStartAndEndKey(type);
  const selector = {
    _id: {
      $gte: idStartKey,
      $lt: idEndKey,
    },
  };
  return selector;
}

export function getDatumFromDoc<T extends DataTypeName>(
  type: T,
  doc: PouchDB.Core.ExistingDocument<{}> | null,
  logger: ReturnType<typeof useLogger>,
  { validate = true }: { validate?: boolean } = {},
): DataTypeWithAdditionalInfo<T> | null {
  if (!doc) return null;

  let id: undefined | string;
  if (doc._id) {
    const { type: typeName, id: iid } = getDataIdFromPouchDbId(doc._id);
    id = iid;

    if (typeName !== type) {
      logger.error(
        `Error parsing "${type}" ID "${doc._id}": document type is ${typeName}`,
        {
          details: JSON.stringify({ doc }, null, 2),
        },
      );
      return null;
    }
  }

  try {
    if (validate) {
      schema[type].parse((doc as any).data);
    }
    if (typeof (doc as any).data !== 'object') {
      throw new Error('doc.data is not an object');
    }

    return new Proxy((doc as any).data, {
      get: function (target, prop) {
        if (prop === '__type') {
          return type;
        }

        if (prop === '__id') {
          return id;
        }

        if (prop === '__rev') {
          return doc._rev;
        }

        if (prop === '__deleted') {
          return (doc as any)._deleted;
        }

        if (prop === '__created_at') {
          return (doc as any).created_at;
        }

        if (prop === '__updated_at') {
          return (doc as any).updated_at;
        }

        return target[prop];
      },
      set: function (target, prop, value) {
        if (prop === '__deleted') {
          return ((doc as any)._deleted = value);
        }

        // Only allow assigning known properties
        if (Object.keys(schema[type].shape).includes(prop as string)) {
          return (target[prop] = value);
        }
      },
    }) as any;
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : JSON.stringify(e, null, 2);
    logger.error(`Error parsing "${type}" ID "${doc._id}": ${errMsg}`, {
      details: JSON.stringify({ doc }, null, 2),
    });
    return null;
  }
}
