import appLogger from '@app/logger';

import {
  DataRelationName,
  DataRelationType,
  DataTypeWithRelationDefsName,
  getRelationTypeAndConfig,
} from '../relations';
import {
  DataTypeWithAdditionalInfo,
  GetRelated,
  InvalidDataTypeWithAdditionalInfo,
  SortOption,
} from '../types';

import getData from './getData';
import getDatum from './getDatum';

export function getGetRelated({
  db,
  logger,
}: {
  db: PouchDB.Database;
  logger: typeof appLogger;
}): GetRelated {
  const getRelated: GetRelated = async function getRelated(
    d,
    relationName,
    { sort },
  ) {
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
          return (await getDatum(relationConfig.type_name, foreignId, {
            db,
            logger,
          })) as any;
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
  };

  return getRelated;
}

export default async function getRelatedLegacy<
  T extends DataTypeWithRelationDefsName,
  N extends DataRelationName<T>,
>(
  d: DataTypeWithAdditionalInfo<T> | InvalidDataTypeWithAdditionalInfo<T>,
  relationName: N,
  options: {
    sort?: SortOption;
  },
  context: {
    db: PouchDB.Database;
    logger: typeof appLogger;
  },
): Promise<DataRelationType<T, N> | null> {
  return await getGetRelated(context)(d, relationName, options);
}
