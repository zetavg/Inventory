import { GetDataCount } from '@invt/data/types';

import { flattenSelector, getCouchDbId } from './couchdb-utils';
import { Context } from './types';

/**
 * We will need to update this if we change the auto ddoc generation logic, so
 * that the app can generate the new and updated design docs.
 */
const AUTO_DDOC_PREFIX = 'auto_get_data_count';

export default function getGetDataCount({
  db,
  dbType,
  logger,
  logLevels,
}: Context): GetDataCount {
  const getDataCount: GetDataCount = async function getDataCount(
    type,
    conditions,
  ) {
    const logDebug = logLevels && logLevels().includes('debug');

    if (!conditions) {
      const ddocName = `${AUTO_DDOC_PREFIX}--${type}`;
      const ddoc = {
        _id: `_design/${ddocName}`,
        views: {
          count: {
            map: getViewFuncForType(type),
            reduce: '_count',
          },
        },
      };

      if (logger && logDebug) {
        logger.debug(
          `getDataCount design doc for ${type}: ${JSON.stringify(
            ddoc,
            null,
            2,
          )}`,
        );
      }

      if (dbType === 'pouchdb') {
        let retries = 0;

        // eslint-disable-next-line no-constant-condition
        while (true) {
          try {
            const body = await db.query(`${ddocName}/count`);
            if (body.rows.length <= 0) return 0;
            if (body.rows.length !== 1) {
              throw new Error(
                `Invalid response body: ${JSON.stringify(
                  body,
                )}, expect 1 row but got ${body.rows.length}`,
              );
            }
            if (typeof body.rows[0].value !== 'number') {
              throw new Error(
                `Invalid response body: ${JSON.stringify(
                  body,
                )}, expect body.rows[0].value to be a number`,
              );
            }
            return body.rows[0].value;
          } catch (e) {
            if (retries > 3) throw e;

            if (logger && logDebug) {
              logger.debug(`getDataCount: creating design doc "${ddoc._id}"`);
            }

            try {
              await db.put(ddoc);
            } catch (err) {
              logger?.warn(
                `Cannot save design doc ${ddoc._id}: ${err} (trying to save design doc because of ${e})`,
              );
            }

            retries += 1;
          }
        }
      } else {
        let retries = 0;

        // eslint-disable-next-line no-constant-condition
        while (true) {
          try {
            const body = await db.view(ddocName, 'count');
            if (body.rows.length <= 0) return 0;
            if (body.rows.length !== 1) {
              throw new Error(
                `Invalid response body: ${JSON.stringify(
                  body,
                )}, expect 1 row but got ${body.rows.length}`,
              );
            }
            if (typeof body.rows[0].value !== 'number') {
              throw new Error(
                `Invalid response body: ${JSON.stringify(
                  body,
                )}, expect body.rows[0].value to be a number`,
              );
            }
            return body.rows[0].value;
          } catch (e) {
            if (retries > 3) throw e;

            if (logger && logDebug) {
              logger.debug(`getDataCount: creating design doc "${ddoc._id}"`);
            }

            try {
              await db.insert(ddoc);
            } catch (err) {
              logger?.warn(
                `Cannot save design doc ${ddoc._id}: ${err} (trying to save design doc because of ${e})`,
              );
            }

            retries += 1;
          }
        }
      }
    }

    const flattenedSelector = flattenSelector(
      Object.fromEntries(
        Object.entries(conditions).map(([k, v]) => [
          (() => {
            switch (k) {
              case '__created_at':
                return 'created_at';
              case '__updated_at':
                return 'updated_at';
              default:
                return `data.${k}`;
            }
          })(),
          v,
        ]),
      ) as any,
    );

    const fields = Object.keys(flattenedSelector).sort();
    const values = fields.map(k => flattenedSelector[k]);
    const key = values.join('--');
    const ddocName = `${AUTO_DDOC_PREFIX}--${type}--${fields.join('-')}`;
    const ddoc = {
      _id: `_design/${ddocName}`,
      views: {
        count: {
          map: getViewFuncForTypeAndFields(type, fields),
          reduce: '_count',
        },
      },
    };

    if (logger && logDebug) {
      logger.debug(
        `getDataCount design doc for ${type} and ${JSON.stringify(
          conditions,
        )}: ${JSON.stringify(ddoc, null, 2)}`,
      );
    }

    if (dbType === 'pouchdb') {
      let retries = 0;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        try {
          const body = await db.query(`${ddocName}/count`, { key });
          if (body.rows.length <= 0) return 0;
          if (body.rows.length !== 1) {
            throw new Error(
              `Invalid response body: ${JSON.stringify(
                body,
              )}, expect 1 row but got ${body.rows.length}`,
            );
          }
          if (typeof body.rows[0].value !== 'number') {
            throw new Error(
              `Invalid response body: ${JSON.stringify(
                body,
              )}, expect body.rows[0].value to be a number`,
            );
          }
          return body.rows[0].value;
        } catch (e) {
          if (retries > 3) throw e;

          if (logger && logDebug) {
            logger.debug(`getDataCount: creating design doc "${ddoc._id}"`);
          }

          try {
            await db.put(ddoc);
          } catch (err) {
            logger?.warn(
              `Cannot save design doc ${ddoc._id}: ${err} (trying to save design doc because of ${e})`,
            );
          }

          retries += 1;
        }
      }
    } else {
      let retries = 0;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        try {
          const body = await db.view(ddocName, 'count', { key });
          if (body.rows.length <= 0) return 0;
          if (body.rows.length !== 1) {
            throw new Error(
              `Invalid response body: ${JSON.stringify(
                body,
              )}, expect 1 row but got ${body.rows.length}`,
            );
          }
          if (typeof body.rows[0].value !== 'number') {
            throw new Error(
              `Invalid response body: ${JSON.stringify(
                body,
              )}, expect body.rows[0].value to be a number`,
            );
          }
          return body.rows[0].value;
        } catch (e) {
          if (retries > 3) throw e;

          if (logger && logDebug) {
            logger.debug(`getDataCount: creating design doc "${ddoc._id}"`);
          }

          try {
            await db.insert(ddoc);
          } catch (err) {
            logger?.warn(
              `Cannot save design doc ${ddoc._id}: ${err} (trying to save design doc because of ${e})`,
            );
          }

          retries += 1;
        }
      }
    }
  };

  return getDataCount;
}

function getViewFuncForType(type: string) {
  return `
function (doc) {
  if (doc.type === '${type}') {
    emit(doc._id);
  }
}
  `.trim();
}

function getViewFuncForTypeAndFields(
  type: string,
  fields: ReadonlyArray<string>,
) {
  return `
function (doc) {
  if (doc.type === '${type}') {
    emit([${fields.map(f => `doc.${f}`).join(', ')}].join('--'));
  }
}
  `.trim();
}
