import {
  GetConfig,
  GetData,
  GetDataCount,
  GetDatum,
  GetRelated,
  SaveDatum,
  UpdateConfig,
} from '@deps/data/types';

import getGetConfig from './functions/getGetConfig';
import getGetData from './functions/getGetData';
import getGetDataCount from './functions/getGetDataCount';
import getGetDatum from './functions/getGetDatum';
import getGetRelated from './functions/getGetRelated';
import getSaveDatum from './functions/getSaveDatum';
import getUpdateConfig from './functions/getUpdateConfig';
import { Context } from './functions/types';

export default class CouchDBData {
  public getConfig: GetConfig;
  public updateConfig: UpdateConfig;
  public getDatum: GetDatum;
  public getData: GetData;
  public getDataCount: GetDataCount;
  public getRelated: GetRelated;
  public saveDatum: SaveDatum;

  constructor(context: Context) {
    this.getConfig = getGetConfig(context);
    this.updateConfig = getUpdateConfig(context);
    this.getDatum = getGetDatum(context);
    this.getData = getGetData(context);
    this.getDataCount = getGetDataCount(context);
    this.getRelated = getGetRelated(context);
    this.saveDatum = getSaveDatum(context);
  }
}
