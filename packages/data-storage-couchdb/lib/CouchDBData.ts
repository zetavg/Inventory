import {
  AttachAttachmentToDatum,
  DataTypeWithID,
  GetAllAttachmentInfoFromDatum,
  GetAttachmentFromDatum,
  GetAttachmentInfoFromDatum,
  GetConfig,
  GetData,
  GetDataCount,
  GetDatum,
  GetDatumHistories,
  GetHistoriesInBatch,
  GetRelated,
  InvalidDataTypeWithID,
  ListHistoryBatchesCreatedBy,
  RestoreHistory,
  SaveDatum,
  UpdateConfig,
  ValidDataTypeWithID,
} from '@deps/data/types';
import csvRowToItem from '@deps/data/utils/csv/csvRowToItem';
import itemToCsvRow from '@deps/data/utils/csv/itemToCsvRow';

import getAttachAttachmentToDatum from './functions/getAttachAttachmentToDatum';
import getGetAllAttachmentInfoFromDatum from './functions/getGetAllAttachmentInfoFromDatum';
import getGetAttachmentFromDatum from './functions/getGetAttachmentFromDatum';
import getGetAttachmentInfoFromDatum from './functions/getGetAttachmentInfoFromDatum';
import getGetConfig from './functions/getGetConfig';
import getGetData from './functions/getGetData';
import getGetDataCount from './functions/getGetDataCount';
import getGetDatum from './functions/getGetDatum';
import getGetDatumHistories from './functions/getGetDatumHistories';
import getGetHistoriesInBatch from './functions/getGetHistoriesInBatch';
import getGetRelated from './functions/getGetRelated';
import getGetViewData, { GetViewData } from './functions/getGetViewData';
import getListHistoryBatchesCreatedBy from './functions/getListHistoryBatchesCreatedBy';
import getRestoreHistory from './functions/getRestoreHistory';
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
  public attachAttachmentToDatum: AttachAttachmentToDatum;
  public getAttachmentInfoFromDatum: GetAttachmentInfoFromDatum;
  public getAttachmentFromDatum: GetAttachmentFromDatum;
  public getAllAttachmentInfoFromDatum: GetAllAttachmentInfoFromDatum;
  public getViewData: GetViewData;

  public getDatumHistories: GetDatumHistories;
  public listHistoryBatchesCreatedBy: ListHistoryBatchesCreatedBy;
  public getHistoriesInBatch: GetHistoriesInBatch;
  public restoreHistory: RestoreHistory;

  public itemToCsvRow: (
    item: DataTypeWithID<'item'>,
  ) => ReturnType<typeof itemToCsvRow>;
  public csvRowToItem: (
    csvRow: Record<string, string>,
  ) => Promise<ValidDataTypeWithID<'item'> | InvalidDataTypeWithID<'item'>>;

  constructor(context: Context) {
    this.getConfig = getGetConfig(context);
    this.updateConfig = getUpdateConfig(context);
    this.getDatum = getGetDatum(context);
    this.getData = getGetData(context);
    this.getDataCount = getGetDataCount(context);
    this.getRelated = getGetRelated(context);
    this.saveDatum = getSaveDatum(context);
    this.attachAttachmentToDatum = getAttachAttachmentToDatum(context);
    this.getAttachmentInfoFromDatum = getGetAttachmentInfoFromDatum(context);
    this.getAttachmentFromDatum = getGetAttachmentFromDatum(context);
    this.getAllAttachmentInfoFromDatum =
      getGetAllAttachmentInfoFromDatum(context);
    this.getViewData = getGetViewData(context);

    this.getDatumHistories = getGetDatumHistories(context);
    this.listHistoryBatchesCreatedBy = getListHistoryBatchesCreatedBy(context);
    this.getHistoriesInBatch = getGetHistoriesInBatch(context);
    this.restoreHistory = getRestoreHistory(context);

    this.itemToCsvRow = it => itemToCsvRow(it, { getDatum: this.getDatum });
    this.csvRowToItem = csvRow =>
      csvRowToItem(csvRow, {
        getConfig: this.getConfig,
        getDatum: this.getDatum,
        getData: this.getData,
      });
  }
}
