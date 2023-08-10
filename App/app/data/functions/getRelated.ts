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
} from '../relations';
import {
  DataTypeWithAdditionalInfo,
  InvalidDataTypeWithAdditionalInfo,
} from '../types';

import getData from './getData';

type Sort = Array<{ [propName: string]: 'asc' | 'desc' }>;

export default async function getRelated<
  T extends DataTypeWithRelationDefsName,
  N extends DataRelationName<T>,
>(
  d: DataTypeWithAdditionalInfo<T> | InvalidDataTypeWithAdditionalInfo<T>,
  relationName: N,
  {
    sort,
  }: {
    sort?: Sort;
  },
  {
    db,
    logger,
  }: {
    db: PouchDB.Database;
    logger: typeof appLogger;
  },
): Promise<DataRelationType<T, N> | null> {
  const [relationType, relationConfig] = getRelationTypeAndConfig(
    d.__type,
    relationName,
  );

  switch (relationType) {
    case 'belongs_to': {
      const foreignId = d[relationConfig.foreign_key];
      if (typeof foreignId !== 'string') {
        return null;
      }

      try {
        const doc = await db.get(
          getPouchDbId(relationConfig.type_name, foreignId),
        );

        return getDatumFromDoc(relationConfig.type_name, doc, logger) as any;
      } catch (e) {
        if (e instanceof Error && e.name === 'not_found') {
          return null as any;
        }
        throw e;
      }
    }
    case 'has_many': {
      const data = await getData(
        relationConfig.type_name,
        {
          [relationConfig.foreign_key]: d.__id,
        },
        { sort },
        { db, logger },
      );
      return data as any;
      // await db.createIndex({
      //   index: {
      //     fields: [`data.${relationConfig.foreign_key}`, '_id'],
      //     // partial_filter_selector: getDataTypeSelector(
      //     //   relationConfig.type_name,
      //     // ),
      //   },
      // });

      // const findRequest: PouchDB.Find.FindRequest<{}> = {
      //   selector: {
      //     [`data.${relationConfig.foreign_key}`]: d.__id,
      //     ...getDataTypeSelector(relationConfig.type_name),
      //   },
      // };
      // const response = await db.find(findRequest);
      // return (
      //   (response?.docs.map(ddd =>
      //     getDatumFromDoc(relationConfig.type_name, ddd, logger),
      //   ) as any) || null
      // );
    }

    default: {
      logger.error(`Unsupported relation type: ${relationType}`, {
        details: JSON.stringify({
          d,
          relationName,
          relationType,
          relationConfig,
        }),
      });
      return null;
    }
  }
}
