import nano from 'nano';

import { GetConfig, GetData, GetDatum, GetRelated } from '@deps/data/types';

import getGetConfig from './functions/getGetConfig';
import getGetData from './functions/getGetData';
import getGetDatum from './functions/getGetDatum';
import getGetRelated from './functions/getGetRelated';

type P =
  | {
      type?: 'couchdb';
      db: nano.DocumentScope<unknown>;
    }
  | {
      type: 'pouchdb';
      db: any;
    };

export default class CouchDBData {
  public getConfig: GetConfig;
  public getDatum: GetDatum;
  public getData: GetData;
  public getRelated: GetRelated;

  constructor(p: P) {
    if (p.type === 'pouchdb') {
      throw new Error('Not implemented yet');
    } else {
      const { db } = p;

      this.getConfig = getGetConfig({ db });
      this.getDatum = getGetDatum({ db });
      this.getData = getGetData({ db });
      this.getRelated = getGetRelated({ db });
    }
  }
}
