import { GetConfig, GetData, GetDatum, GetRelated } from '@deps/data/types';

import getGetConfig from './functions/getGetConfig';
import getGetData from './functions/getGetData';
import getGetDatum from './functions/getGetDatum';
import getGetRelated from './functions/getGetRelated';
import { Context } from './functions/types';

export default class CouchDBData {
  public getConfig: GetConfig;
  public getDatum: GetDatum;
  public getData: GetData;
  public getRelated: GetRelated;

  constructor(context: Context) {
    this.getConfig = getGetConfig(context);
    this.getDatum = getGetDatum(context);
    this.getData = getGetData(context);
    this.getRelated = getGetRelated(context);
  }
}
