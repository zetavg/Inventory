import useLogger from '@app/hooks/useLogger';

import schema, { DATA_TYPE_NAMES, DataTypeName } from './schema';
import {
  DATA_ADDITIONAL_INFO_KEYS,
  DataTypeWithAdditionalInfo,
  InvalidDataTypeWithAdditionalInfo,
} from './types';

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

export function getDataTypeSelector_deprecated(
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
  {}: {} = {},
): DataTypeWithAdditionalInfo<T> | InvalidDataTypeWithAdditionalInfo<T> {
  if (!doc) {
    return {
      __type: type,
      __raw: doc,
      __valid: false,
    };
  }

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
      return {
        __type: type,
        __raw: doc,
        __valid: false,
      };
    }
  }

  const parseResults = schema[type].safeParse((doc as any).data);
  if (!parseResults.success) {
    const errMsg = JSON.stringify(parseResults, null, 2);
    logger.warn(`Error parsing "${type}" ID "${doc._id}": ${errMsg}`, {
      details: JSON.stringify({ doc }, null, 2),
    });
  }

  function getProxiedDoc(
    d: any,
    valid: boolean,
    error: unknown,
    error_details: unknown,
  ) {
    return new Proxy(d.data || {}, {
      get: function (target, prop) {
        if (prop === '__type') {
          return type;
        }

        if (prop === '__id') {
          return id;
        }

        if (prop === '__rev') {
          return d._rev;
        }

        if (prop === '__deleted') {
          return d._deleted;
        }

        if (prop === '__created_at') {
          return d.created_at;
        }

        if (prop === '__updated_at') {
          return d.updated_at;
        }

        if (prop === '__deleted') {
          return d._deleted;
        }

        if (prop === '__raw') {
          return d;
        }

        if (prop === '__valid') {
          return valid;
        }

        if (prop === '__error_details') {
          return error_details;
        }

        // if (prop === '__clone') {
        //   return () => getProxiedDoc(JSON.parse(JSON.stringify(doc)));
        // }

        return target[prop];
      },
      set: function (target, prop, value) {
        if (prop === '__id') {
          return (d._id = value);
        }

        if (prop === '__rev') {
          return (d._rev = value);
        }

        if (prop === '__deleted') {
          return (d._deleted = value);
        }

        if (prop === '__created_at') {
          return (d.created_at = value);
        }

        if (prop === '__updated_at') {
          return (d.updated_at = value);
        }

        if (prop === '__deleted') {
          return (d._deleted = value);
        }

        // Only allow assigning known properties
        if (Object.keys(schema[type].shape).includes(prop as string)) {
          return (target[prop] = value);
        }
      },
      ownKeys: function () {
        return [
          ...DATA_ADDITIONAL_INFO_KEYS,
          ...Object.keys(schema[type].shape),
        ];
      },
      getOwnPropertyDescriptor: function (target, prop) {
        if (DATA_ADDITIONAL_INFO_KEYS.includes(prop as any)) {
          return {
            configurable: true,
            enumerable: true,
          };
        }
        return Object.getOwnPropertyDescriptor(target, prop);
      },
    }) as any;
  }

  return getProxiedDoc(
    doc,
    parseResults.success,
    null,
    parseResults.success ? null : parseResults,
  );
}
