// @ts-nocheck

import { v4 as uuidv4 } from 'uuid';
import { launchImageLibrary, ErrorCode } from 'react-native-image-picker';
import ImageResizer from 'react-native-image-resizer';
import { AttachmentsDatabase } from '@app/db';
import base64FromFile from '@app/utils/base64FromFile';
import getThumbnailId from './getThumbnailId';

class ImagePickerError extends Error {
  code: ErrorCode;

  constructor(message: string, code: ErrorCode) {
    super(message);
    this.name = 'ImagePickerError';
    this.code = code;
  }
}

export async function remove({
  attachmentsDB,
  uuid,
}: {
  attachmentsDB: AttachmentsDatabase;
  uuid: string;
}) {
  const d = await attachmentsDB.get(uuid);
  await attachmentsDB.remove(d._id, d._rev);
  const dts128 = await attachmentsDB.get(getThumbnailId(uuid, 's128'));
  await attachmentsDB.remove(dts128._id, dts128._rev);
  const dts64 = await attachmentsDB.get(getThumbnailId(uuid, 's64'));
  await attachmentsDB.remove(dts64._id, dts64._rev);
}

export default remove;
