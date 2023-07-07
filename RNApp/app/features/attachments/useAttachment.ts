// @ts-nocheck

import { useEffect, useState } from 'react';
import {
  AttachmentsDBContent,
  AttachmentsDBThumbnailType,
} from '@app/db/types';
import useDB from '@app/hooks/useDB';
import getThumbnailId from './getThumbnailId';

export default function useAttachment(
  attachmentUUID: string,
  thumbnailType?: AttachmentsDBThumbnailType,
) {
  const { attachmentsDB } = useDB();

  const [doc, setDoc] = useState<AttachmentsDBContent | null>(null);

  useEffect(() => {
    attachmentsDB
      .get(
        thumbnailType
          ? getThumbnailId(attachmentUUID, thumbnailType)
          : attachmentUUID,
      )
      .then(d => setDoc(d));
  }, [attachmentUUID, attachmentsDB, thumbnailType]);

  return doc;
}
