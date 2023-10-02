import { DATA_TYPE_NAMES, DataTypeName } from '../schema';
import { GetData, GetDataCount, SaveDatum } from '../types';

export type Progress = Record<
  DataTypeName,
  {
    total: number;
    done: number;
    errored?: number;
    errors?: Array<{ type: string; id: string; error: unknown }>;
  }
>;

export default async function* fixDataConsistency({
  getData,
  getDataCount,
  saveDatum,
  batchSize = 10,
}: {
  getData: GetData;
  getDataCount: GetDataCount;
  saveDatum: SaveDatum;
  batchSize?: number;
}) {
  const progress: Progress = Object.fromEntries(
    DATA_TYPE_NAMES.map(n => [n, { done: 0, total: 0 }]),
  ) as any;
  for (const typeName of DATA_TYPE_NAMES) {
    const dataCount = await getDataCount(typeName);
    progress[typeName].total = dataCount;

    let ended = false;
    let batch = 0;
    while (!ended) {
      const data = await getData(
        typeName,
        {},
        { limit: batchSize, skip: batchSize * batch },
      );

      if (data.length === 0) {
        ended = true;
        continue;
      }

      for (const d of data) {
        try {
          await saveDatum(d, { noTouch: true });
        } catch (e) {
          progress[typeName].errored = (progress[typeName].errored || 0) + 1;
          if (!Array.isArray(progress[typeName].errors)) {
            progress[typeName].errors = [];
          }
          (progress[typeName].errors as any).push({
            type: typeName,
            id: d.__id || '',
            error: e,
          });
        } finally {
          progress[typeName].done += 1;
          yield progress;
        }
      }

      batch += 1;
    }
  }
}
