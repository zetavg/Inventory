import { Database } from './pouchdb';
import schema, { Schema, TypeName, DataType, RelationDef } from './schema';

export type FindWithRelationsReturnedData = {
  data: any;
  getRelated: <T extends TypeName>(
    field: string,
    options: { arrElementType: T },
  ) => ReadonlyArray<DataType<T>>;
};

/**
 * A wrapper of `db.rel.find` with better types and returned data format.
 * @type {[type]}
 */
export async function findWithRelations(
  db: Database,
  type: TypeName,
  id: number | string,
): Promise<FindWithRelationsReturnedData> {
  const typeDef = schema[type];
  if (!typeDef) throw new Error(`No such type: ${type}`);

  const data = await db.rel.find(type, id);
  const doc =
    data &&
    data[typeDef.plural] &&
    data[typeDef.plural].find((d: any) => d?.id === id);

  if (!doc) return { data: null, getRelated: () => [] };

  const relatedData: Record<
    string,
    undefined | Array<DataType<any>> | DataType<any>
  > = {};

  Object.entries(data).forEach(([relationDataTypePlural, relationData]) => {
    const relationDataTypeNameAndDef = Object.entries(schema).find(
      ([_, def]) => def.plural === relationDataTypePlural,
    );
    if (!relationDataTypeNameAndDef) return;

    const [relationDataTypeName, _relationDataTypeDef] =
      relationDataTypeNameAndDef;

    const relatedRelations = Object.entries(typeDef.relations || {}).filter(
      ([_field, relation]) =>
        relation?.belongsTo === relationDataTypeName ||
        relation?.belongsTo?.type === relationDataTypeName ||
        relation?.hasMany === relationDataTypeName ||
        relation?.hasMany?.type === relationDataTypeName,
    );

    // Check each datum against each relation and see where they belongs to.
    (relationData as any).forEach((relationD: any) => {
      relatedRelations.forEach(([field, relation]) => {
        const relationDefValue =
          (relation as any).belongsTo || (relation as any).hasMany;
        if (Array.isArray(doc[field]) && doc[field].includes(relationD.id)) {
          // Has many relation without queryInverse
          if (!relatedData[field]) relatedData[field] = [];
          relatedData[field]?.push(relationD);
        } else if (doc[field] === relationD.id) {
          // belongsTo
          relatedData[field] = relationD;
        } else if (
          typeof relationDefValue === 'object' &&
          (relationDefValue as any).options?.queryInverse &&
          relationD[(relationDefValue as any).options?.queryInverse] === doc.id
        ) {
          // Has many relation with queryInverse
          if (!relatedData[field]) relatedData[field] = [];
          relatedData[field]?.push(relationD);
        }
      });
    });
  });

  const getRelated: FindWithRelationsReturnedData['getRelated'] = field => {
    const d = relatedData[field];
    if (!d) return [];

    if (Array.isArray(d)) return d;
    return [d];
  };

  return { data: doc, getRelated };
}

/**
 * Get related data type name from relation definition
 */
export function getDataTypeNameFromRelation(
  relation: any,
): TypeName | undefined {
  if (typeof relation?.belongsTo === 'string') return relation.belongsTo;
  if (typeof relation?.hasMany === 'string') return relation.hasMany;
  if (typeof relation?.belongsTo?.type === 'string')
    return relation?.belongsTo?.type;
  if (typeof relation?.hasMany?.type === 'string')
    return relation?.hasMany?.type;
}

/**
 * Get relation type (`hasMany`, `belongsTo`) name from relation definition
 */
export function getTypeFromRelation(relation: RelationDef): string | undefined {
  return Object.keys(relation)[0];
}

export function getQueryInverseFromRelation(
  relation: any,
): TypeName | undefined {
  if (
    typeof relation?.hasMany === 'object' &&
    relation.hasMany?.options?.queryInverse
  )
    return relation.hasMany?.options?.queryInverse;
}

/**
 * Translate schema to relational-pouch schema.
 */
export function translateSchema(s: Schema) {
  return Object.entries(s).map(([singular, { relations, ...typeDef }]) => ({
    ...typeDef,
    singular,
    relations: Object.fromEntries(
      Object.entries(relations).filter(([_field, relDef]) => {
        const t = Object.keys(relDef)[0];
        return t === 'belongsTo' || t === 'hasMany';
      }),
    ),
  }));
}
