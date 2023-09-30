import schema, { DATA_TYPE_NAMES, DataTypeName } from '@deps/data/schema';
import {
  DataTypeWithID,
  InvalidDataTypeWithID,
  ValidDataTypeWithID,
} from '@deps/data/types';

import { CouchDBDoc, Logger } from './types';

export function getCouchDbId(type: DataTypeName, id: string) {
  return `${type}-${id}`;
}

export function getDataIdFromCouchDbId(id: string): {
  type: DataTypeName;
  id: string;
} {
  const [type, ...idParts] = id.split('-');
  if (!DATA_TYPE_NAMES.includes(type as any)) {
    throw new Error(
      `getDataIdFromCouchDbId: type "${type}" is unknown (${id})`,
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

const DATA_ADDITIONAL_INFO_KEYS = [
  '__type',
  '__id',
  '__rev',
  '__deleted',
  '__created_at',
  '__updated_at',
] as const;

export function getDatumFromDoc<T extends DataTypeName>(
  type: T,
  doc: CouchDBDoc | null,
  {
    logger = console,
    logLevels,
  }: { logger?: Logger; logLevels?: () => ReadonlyArray<string> } = {},
): ValidDataTypeWithID<T> | InvalidDataTypeWithID<T> {
  if (!doc) {
    logger?.warn('getDatumFromDoc: invalid doc - got a falsely value');

    return {
      __type: type,
      __raw: doc,
      __valid: false,
    };
  }

  if (doc._id) {
    const { type: typeName } = getDataIdFromCouchDbId(doc._id);

    if (typeName !== type) {
      logger?.warn(
        `getDatumFromDoc: type from doc ID "${doc._id}" does not match the expected data type "${type}"`,
      );
      return {
        __type: type,
        __raw: doc,
        __valid: false,
      };
    }
  }

  return getProxiedDocDatum(type, doc, { logger, logLevels });
}

function getProxiedDocDatum(
  type: DataTypeName,
  d: CouchDBDoc,
  {
    logger = console,
  }: { logger?: Logger; logLevels?: () => ReadonlyArray<string> } = {},
) {
  const { id } = d._id ? getDataIdFromCouchDbId(d._id) : { id: undefined };
  const s = schema[type];
  let parseResults: ReturnType<typeof s.safeParse> | undefined;
  const getParseResults = () => {
    if (parseResults) return parseResults;

    parseResults = s.safeParse(d?.data);

    if (!parseResults?.success) {
      logger?.warn(
        `getProxiedDocDatum: invalid doc for type "${type}": ${JSON.stringify(
          parseResults,
          null,
          2,
        )}, doc: ${JSON.stringify(d, null, 2)}`,
      );
    }

    return parseResults;
  };
  return new Proxy((d.data || {}) as Record<string | symbol, unknown>, {
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

      if (prop === '__raw') {
        return d;
      }

      if (prop === '__valid') {
        return getParseResults().success;
      }

      if (prop === '__error_details') {
        return getParseResults();
      }

      return target[prop];
    },
    set: function (target, prop, value) {
      if (prop === '__id') {
        d._id = value;
        return true;
      }

      if (prop === '__rev') {
        d._rev = value;
        return true;
      }

      if (prop === '__deleted') {
        d._deleted = value;
        return true;
      }

      if (prop === '__created_at') {
        d.created_at = value;
        return true;
      }

      if (prop === '__updated_at') {
        d.updated_at = value;
        return true;
      }

      if (prop === '__deleted') {
        d._deleted = value;
        return true;
      }

      // Only allow assigning known properties
      if (Object.keys(schema[type].shape).includes(prop as string)) {
        target[prop] = value;
        return true;
      }

      return false;
    },
    ownKeys: function (target) {
      return [...DATA_ADDITIONAL_INFO_KEYS, ...Object.keys(target)];
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

export function getDocFromDatum<T extends DataTypeName>(
  d: DataTypeWithID<T>,
  { logger = console }: { logger?: Logger } = {},
): CouchDBDoc {
  let {
    __type,
    __id,
    __rev,
    __deleted,
    __created_at,
    __updated_at,
    ...unfilteredPureData
  } = d;

  const pureData: typeof unfilteredPureData = Object.fromEntries(
    Object.entries(unfilteredPureData).filter(([k]) => !k.startsWith('__')),
  ) as any;

  const s = (schema as any)[__type as any];

  const doc: Record<string, unknown> = {
    ...(__id ? { _id: getCouchDbId(__type as any, __id as any) } : {}),
    ...(__rev ? { _rev: __rev } : {}),
    ...(__deleted ? { _deleted: __deleted } : {}),
    type: __type,
    data: sortObjectKeys(pureData, Object.keys(s?.shape || {})),
    ...(typeof __created_at === 'number' ? { created_at: __created_at } : {}),
    ...(typeof __updated_at === 'number' ? { updated_at: __updated_at } : {}),
  };

  return doc as any;
}

export function flattenSelector(obj: any, parent = '', result = {} as any) {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (key.startsWith('$') && parent) {
        result[parent] = obj;
        return result;
      }
      const newKey = parent ? `${parent}.${key}` : key;

      const value = obj[key];
      if (value && typeof value === 'object') {
        flattenSelector(obj[key], newKey, result);
      } else {
        result[newKey] = obj[key];
      }
    }
  }
  return result;
}

export function sortObjectKeys<T extends Record<string, unknown>>(
  obj: T,
  sort: ReadonlyArray<string>,
) {
  const sortedObj: any = {};
  for (const key of sort) {
    if (obj.hasOwnProperty(key)) {
      sortedObj[key] = obj[key];
    }
  }

  const sortedKeysSet = new Set(sort);
  for (const key of Object.keys(obj).filter(k => !sortedKeysSet.has(k))) {
    sortedObj[key] = obj[key];
  }

  return sortedObj;
}
