import { getDatumFromDoc } from './functions/couchdb-utils';
import getGetConfig from './functions/getGetConfig';
import getGetData from './functions/getGetData';
import getGetDataCount from './functions/getGetDataCount';
import getGetDatum from './functions/getGetDatum';
import getGetRelated from './functions/getGetRelated';
import getSaveDatum from './functions/getSaveDatum';
import getUpdateConfig from './functions/getUpdateConfig';
import CouchDBData from './CouchDBData';
export type { Context, CouchDBDoc, Logger } from './functions/types';
export {
  CouchDBData,
  getDatumFromDoc,
  getGetConfig,
  getGetData,
  getGetDataCount,
  getGetDatum,
  getGetRelated,
  getSaveDatum,
  getUpdateConfig,
};
