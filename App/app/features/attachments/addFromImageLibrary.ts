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

export async function addFromImageLibrary({
  attachmentsDB,
  selectionLimit,
}: {
  attachmentsDB: AttachmentsDatabase;
  selectionLimit: number;
}) {
  if (!selectionLimit || selectionLimit < 1) selectionLimit = 1;

  const result = await launchImageLibrary({
    mediaType: 'photo',
    selectionLimit,
    maxWidth: 2048,
    maxHeight: 2048,
    includeBase64: true,
  });

  if (result.didCancel) return;

  if (result.errorCode) {
    throw new ImagePickerError(
      result.errorMessage || result.errorCode,
      result.errorCode,
    );
  }

  for (const asset of result.assets || []) {
    if (!asset) continue;
    if (!asset.uri) return;
    if (!asset.base64) return;

    const uuid = uuidv4();
    const content_type = asset.type;
    const file_name = asset.fileName;
    const added_at = Date.now();
    const data = `data:${content_type};base64,${asset.base64}`;
    const dimensions =
      asset.width && asset.height
        ? {
            width: asset.width,
            height: asset.height,
          }
        : undefined;

    const { uri: thumbnail128Uri } = await ImageResizer.createResizedImage(
      asset.uri,
      128,
      128,
      'JPEG',
      100,
      0,
      undefined,
      false,
      { mode: 'cover' },
    );
    const thumbnail128Data = `data:image/jpg;base64,${await base64FromFile(
      thumbnail128Uri,
    )}`;
    const { uri: thumbnail64Uri } = await ImageResizer.createResizedImage(
      asset.uri,
      64,
      64,
      'JPEG',
      100,
      0,
      undefined,
      false,
      { mode: 'cover' },
    );
    const thumbnail64Data = `data:image/jpg;base64,${await base64FromFile(
      thumbnail64Uri,
    )}`;

    await attachmentsDB.put({
      _id: uuid,
      file_name,
      content_type,
      data,
      dimensions,
      added_at,
    });

    await attachmentsDB.put({
      _id: getThumbnailId(uuid, 's128'),
      thumbnail_type: 's128',
      file_name,
      content_type,
      data: thumbnail128Data,
      original_dimensions: dimensions,
      added_at,
    });

    await attachmentsDB.put({
      _id: getThumbnailId(uuid, 's64'),
      thumbnail_type: 's64',
      file_name,
      content_type,
      data: thumbnail64Data,
      original_dimensions: dimensions,
      added_at,
    });
  }
}

export default addFromImageLibrary;
