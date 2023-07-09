import { DATA_TYPE_NAMES, DataTypeName } from './schema';

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

export function getDataTypeSelector(
  type: DataTypeName,
): PouchDB.Find.FindRequest<{}>['selector'] {
  const idStartKey = `${type}-`;
  const idEndKey = idStartKey + '\uffff';
  const selector = {
    _id: {
      $gte: idStartKey,
      $lt: idEndKey,
    },
  };
  return selector;
}
