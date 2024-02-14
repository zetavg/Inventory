import schema, { DATA_TYPE_NAMES, DataTypeName } from '@invt/data/schema';
import {
  DataMeta,
  DataTypeWithID,
  InvalidDataTypeWithID,
  ValidDataTypeWithID,
} from '@invt/data/types';
import { getValidationErrorFromZodSafeParseReturnValue } from '@invt/data/utils/validation-utils';
import { ValidationError } from '@invt/data/validation';

import DATA_TYPE_PREFIX from '../data-type-prefix';
import { CouchDBDoc, Logger } from './types';

export function getCouchDbId(type: DataTypeName, id: string) {
  const prefix = DATA_TYPE_PREFIX[type];
  if (prefix) return `${prefix}-${type}-${id}`;
  return `${type}-${id}`;
}

export function getDataIdFromCouchDbId(id: string): {
  type: DataTypeName;
  id: string;
} {
  const [type, ...idParts] = (() => {
    for (const typeName in DATA_TYPE_PREFIX) {
      const prefix = (DATA_TYPE_PREFIX as any)[typeName];
      const typeNameWithPrefix = `${prefix}-${typeName}`;
      if (id.startsWith(typeNameWithPrefix)) {
        return [
          typeName,
          ...id.slice(typeNameWithPrefix.length + 1).split('-'),
        ];
      }
    }
    return id.split('-');
  })();

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
  const idStartKey = getCouchDbId(type, '');
  const idEndKey = getCouchDbId(type, '\uffff');
  return [idStartKey, idEndKey];
}

const DATA_ADDITIONAL_INFO_KEYS = [
  '__type',
  '__id',
  '__rev',
  '__deleted',
  '__created_at',
  '__updated_at',
  '__raw',
] as const;

export function getDatumFromDoc<T extends DataTypeName>(
  type: T,
  doc: CouchDBDoc | null,
  {
    logger = console,
    logLevels,
  }: { logger?: Logger | null; logLevels?: () => ReadonlyArray<string> } = {},
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
  }: { logger?: Logger | null; logLevels?: () => ReadonlyArray<string> } = {},
) {
  const s = schema[type];
  let validationError: ValidationError | null | undefined;
  const getValidationError = () => {
    if (validationError !== undefined) return validationError;

    validationError = getValidationErrorFromZodSafeParseReturnValue(
      s.safeParse(d?.data),
    );

    if (validationError) {
      logger?.warn(
        `getProxiedDocDatum: invalid doc for type "${type}": ${JSON.stringify(
          validationError.issues,
          null,
          2,
        )}, doc: ${JSON.stringify(d, null, 2)}`,
      );
    }

    return validationError;
  };

  /** This `proxyTarget` is for previewing the data in the JS console. */
  const proxyTarget: Record<string, string | number | boolean | undefined> = {};
  function updatePt() {
    for (const key in proxyTarget) {
      if (proxyTarget.hasOwnProperty(key)) {
        delete proxyTarget[key];
      }
    }
    const { id } = d._id ? getDataIdFromCouchDbId(d._id) : { id: undefined };

    proxyTarget.__type = type;
    proxyTarget.__id = id;

    switch (type) {
      case 'collection': {
        proxyTarget.name = ((d.data || {}) as any).name;
        proxyTarget.collection_reference_number = (
          (d.data || {}) as any
        ).collection_reference_number;
        break;
      }
      case 'item': {
        proxyTarget.name = ((d.data || {}) as any).name;
        proxyTarget.individual_asset_reference = (
          (d.data || {}) as any
        ).individual_asset_reference;
        break;
      }
    }
  }
  updatePt();

  return new Proxy(proxyTarget, {
    get: function (_target, prop) {
      if (prop === '__type') {
        return type;
      }

      if (prop === '__id') {
        const { id } = d._id
          ? getDataIdFromCouchDbId(d._id)
          : { id: undefined };
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
        return !getValidationError();
      }

      if (prop === '__issues') {
        const error = getValidationError();
        return error?.issues;
      }

      if (prop === '__error') {
        return getValidationError() || undefined;
      }

      if (prop === '__error_details') {
        return getValidationError();
      }

      return ((d.data || {}) as any)[prop];
    },
    set: function (_target, prop, value) {
      const success = (() => {
        if (prop === '__id') {
          d._id = getCouchDbId(type, value);
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
          if (typeof d.data !== 'object') {
            d.data = {};
          }
          (d.data as any)[prop] = value;
          return true;
        }

        return false;
      })();

      if (success) {
        updatePt();
      }

      return success;
    },
    ownKeys: function (_target) {
      return [...DATA_ADDITIONAL_INFO_KEYS, ...Object.keys(d.data || {})];
    },
    getOwnPropertyDescriptor: function (_target, prop) {
      if (DATA_ADDITIONAL_INFO_KEYS.includes(prop as any)) {
        return {
          configurable: true,
          enumerable: true,
        };
      }
      return Object.getOwnPropertyDescriptor(d.data, prop);
    },
  }) as any;
}

export function getDocFromDatum<T extends DataTypeName>(
  d: Partial<DataTypeWithID<T>> & DataMeta<T>,
  { logger = console }: { logger?: Logger | null } = {},
): CouchDBDoc {
  const {
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
