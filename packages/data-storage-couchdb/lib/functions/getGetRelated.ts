import type nano from 'nano';

import { getRelationTypeAndConfig } from '@deps/data/relations';
import { GetRelated } from '@deps/data/types';

import getGetData from './getGetData';
import getGetDatum from './getGetDatum';

export default function getGetRelated({
  db,
}: {
  db: nano.DocumentScope<unknown>;
}): GetRelated {
  const getDatum = getGetDatum({ db });
  const getData = getGetData({ db });
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
          return (await getDatum(relationConfig.type_name, foreignId)) as any;
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
        );
        return data as any;
      }

      default: {
        return null;
      }
    }
  };

  return getRelated;
}
