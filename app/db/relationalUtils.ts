import { Database } from './pouchdb';
import schema, { Type } from './schema';

export type FindWithRelationsReturnedData = {
  data: any;
  relations: {
    [field: string]: {
      type: Type;
      relation: 'belongsTo' | 'hasMany';
      queryInverse?: string;
      data: any;
    };
  };
};

/**
 * A wrapper of `db.rel.find` with better types and returned data format.
 * @type {[type]}
 */
export async function findWithRelations(
  db: Database,
  type: Type,
  id: number | string,
): Promise<FindWithRelationsReturnedData> {
  const typeDef = schema.find(s => s.singular === type);
  if (!typeDef) throw new Error(`No such type: ${type}`);

  const data = await db.rel.find(type, id);
  const doc =
    data[typeDef.plural] && data[typeDef.plural].find((d: any) => d?.id === id);

  if (!doc) return { data: null, relations: {} };

  const returnedRelations: any = Object.fromEntries(
    Object.entries(typeDef.relations || {}).map(([field, r]) => [
      field,
      {
        type: getTypeFromRelation(r),
        relation: Object.keys(r)[0],
        queryInverse: getQueryInverseFromRelation(r),
        data: [],
      },
    ]),
  );

  Object.entries(data).forEach(([relationDataTypePlural, relationData]) => {
    const relationDataType = schema.find(
      s => s.plural === relationDataTypePlural,
    );
    if (!relationDataType) return;

    const relatedRelation = Object.entries(typeDef.relations || {}).filter(
      ([_field, relation]) =>
        (relation as any)?.belongsTo === relationDataType.singular ||
        (relation as any)?.belongsTo?.type === relationDataType.singular ||
        (relation as any)?.hasMany === relationDataType.singular ||
        (relation as any)?.hasMany?.type === relationDataType.singular,
    );

    (relationData as any).forEach((relationD: any) => {
      relatedRelation.forEach(([field, relation]) => {
        const relationK =
          (relation as any).belongsTo || (relation as any).hasMany;
        if (Array.isArray(doc[field]) && doc[field].includes(relationD.id)) {
          if (!returnedRelations[field])
            returnedRelations[field] = {
              type: relationDataType.singular,
              data: [],
            };
          returnedRelations[field].data.push(relationD);
        } else if (doc[field] === relationD.id) {
          if (!returnedRelations[field])
            returnedRelations[field] = {
              type: relationDataType.singular,
              data: [],
            };
          returnedRelations[field].data = relationD;
        } else if (
          typeof relationK === 'object' &&
          (relationK as any).options?.queryInverse &&
          relationD[(relationK as any).options?.queryInverse] === doc.id
        ) {
          if (!returnedRelations[field])
            returnedRelations[field] = {
              type: relationDataType.singular,
              data: [],
            };
          returnedRelations[field].data.push(relationD);
        }
      });
    });
  });

  return { data: doc, relations: returnedRelations };
}

function getTypeFromRelation(relation: any) {
  if (typeof relation?.belongsTo === 'string') return relation.belongsTo;
  if (typeof relation?.hasMany === 'string') return relation.hasMany;
  if (typeof relation?.belongsTo?.type === 'string')
    return relation?.belongsTo?.type;
  if (typeof relation?.hasMany?.type === 'string')
    return relation?.hasMany?.type;
}

function getQueryInverseFromRelation(relation: any) {
  if (
    typeof relation?.hasMany === 'object' &&
    relation.hasMany?.options?.queryInverse
  )
    return relation.hasMany?.options?.queryInverse;
}
