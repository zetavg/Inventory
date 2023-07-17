import appLogger from '@app/logger';

import {
  getDataTypeSelector,
  getDatumFromDoc,
  getPouchDbId,
} from '../pouchdb-utils';
import {
  DataRelationName,
  DataRelationType,
  DataTypeWithRelationDefsName,
  getRelationTypeAndConfig,
  relation_definitions,
} from '../relations';
import { DataTypeWithAdditionalInfo } from '../types';

export default async function getRelated<
  T extends DataTypeWithRelationDefsName,
  N extends DataRelationName<T>,
>(
  d: DataTypeWithAdditionalInfo<T>,
  relationName: N,
  {
    db,
    logger,
    validate,
  }: {
    db: PouchDB.Database;
    logger: typeof appLogger;
    validate?: boolean;
  },
): Promise<DataRelationType<T, N>> {
  const [relationType, relationConfig] = getRelationTypeAndConfig(
    d.__type,
    relationName,
  );

  switch (relationType) {
    case 'belongs_to': {
      const foreignId = (d as any)[relationConfig.foreign_key];
      if (!foreignId) {
        return null as any;
      }

      try {
        const doc = await db.get(
          getPouchDbId(relationConfig.type_name, foreignId),
        );

        return getDatumFromDoc(relationConfig.type_name, doc, logger, {
          validate: typeof validate === 'boolean' ? validate : true,
        }) as any;
      } catch (e) {
        if (e instanceof Error && e.name === 'not_found') {
          return null as any;
        }
        throw e;
      }
    }
    case 'has_many': {
      await db.createIndex({
        index: {
          fields: [`data.${relationConfig.foreign_key}`, '_id'],
          // partial_filter_selector: getDataTypeSelector(
          //   relationConfig.type_name,
          // ),
        },
      });

      const findRequest: PouchDB.Find.FindRequest<{}> = {
        selector: {
          [`data.${relationConfig.foreign_key}`]: d.__id,
          ...getDataTypeSelector(relationConfig.type_name),
        },
      };
      const response = await db.find(findRequest);
      return (
        (
          response?.docs.map(ddd =>
            getDatumFromDoc(relationConfig.type_name, ddd, logger, {
              validate: typeof validate === 'boolean' ? validate : true,
            }),
          ) as any
        ).filter((dddd: any) => !!dddd) || null
      );
    }

    default: {
      throw new Error(`Unsupported relation type: ${relationType}`);
    }
  }
}
