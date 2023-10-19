import VIEWS, { VIEWS_PREFIX } from '../views';

import { Context } from './types';

export type GetViewDataOptions = {
  key?: string | ReadonlyArray<string>;
  startKey?: string | ReadonlyArray<string> | number;
  endKey?: string | ReadonlyArray<string> | number;
  descending?: boolean;
  includeDocs?: boolean;
};

export type ViewName = keyof typeof VIEWS;

export type ViewDataType<T extends ViewName> = ReturnType<
  (typeof VIEWS)[T]['dataParser']
>;

export type GetViewData = <T extends ViewName>(
  viewName: T,
  options?: GetViewDataOptions,
) => Promise<ViewDataType<T>>;

export default function getGetViewData({
  db,
  dbType,
  logger,
  logLevels,
}: Context): GetViewData {
  const getViewData: GetViewData = async function getViewData(
    viewName,
    { key, startKey, endKey, descending, includeDocs } = {},
  ) {
    const view = VIEWS[viewName];
    const fullViewName = `${VIEWS_PREFIX}_${viewName}_v${view.version}`;
    const dbQuery = () => {
      if (dbType === 'pouchdb') {
        return db.query(fullViewName, {
          key,
          startkey: startKey,
          endkey: endKey,
          descending,
          include_docs: includeDocs,
        });
      } else {
        return db.view(fullViewName, fullViewName, {
          key,
          startkey: startKey,
          endkey: endKey,
          descending,
          include_docs: includeDocs,
        });
      }
    };

    let retries = 0;
    while (true) {
      try {
        const results = await dbQuery();
        const parsedResults: ReturnType<typeof view.dataParser> =
          view.dataParser(results);
        return parsedResults as any;
      } catch (e) {
        if (retries > 3) {
          throw e;
        }

        try {
          if (dbType === 'pouchdb') {
            const { _rev } = await db
              .get(`_design/${fullViewName}`)
              .catch(() => ({ _rev: undefined }));
            await db.put({
              _id: `_design/${fullViewName}`,
              _rev,
              views: {
                [fullViewName]: {
                  map: view.map,
                  reduce: (view as any).reduce,
                },
              },
            });
          } else {
            const { _rev } = await db
              .get(`_design/${fullViewName}`)
              .catch(() => ({ _rev: undefined }));
            await db.insert({
              _id: `_design/${fullViewName}`,
              _rev,
              views: {
                [fullViewName]: {
                  map: view.map,
                  reduce: (view as any).reduce,
                },
              },
            });
          }
        } catch (ee) {
          logger?.error(
            `Error on creating view "${fullViewName}": ${
              ee instanceof Error ? ee.message : ee
            }`,
          );
        }

        if (
          !(
            e instanceof Error &&
            (e.message === 'missing' || e.message === 'not_found')
          )
        ) {
          logger?.error(
            `Error on using view "${fullViewName}": ${
              e instanceof Error ? e.message : e
            }`,
          );
        }

        retries += 1;
      }
    }
  };

  return getViewData;
}
