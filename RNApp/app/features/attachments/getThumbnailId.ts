// @ts-nocheck

import { AttachmentsDBThumbnailType } from '@app/db/types';

export default function getThumbnailId(
  id: string,
  thumbnailType: AttachmentsDBThumbnailType,
) {
  return `thumbnail-${thumbnailType}-${id}`;
}
