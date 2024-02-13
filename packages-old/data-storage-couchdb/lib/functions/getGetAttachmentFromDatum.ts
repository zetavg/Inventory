import { GetAttachmentFromDatum } from '@deps/data/types';

import { getCouchDbId } from './couchdb-utils';
import getGetAttachmentInfoFromDatum from './getGetAttachmentInfoFromDatum';
import getGetDatum from './getGetDatum';
import { Context } from './types';

export default function getGetAttachmentFromDatum(
  context: Context,
): GetAttachmentFromDatum {
  const getAttachmentInfoFromDatum = getGetAttachmentInfoFromDatum(context);
  const getAttachmentFromDatum: GetAttachmentFromDatum =
    async function getAttachmentFromDatum(d, attachmentName) {
      const attachmentInfo = await getAttachmentInfoFromDatum(
        d,
        attachmentName,
      );

      if (!attachmentInfo) return attachmentInfo;

      if (context.dbType === 'pouchdb') {
        const data = await context.db.getAttachment(
          getCouchDbId(d.__type, d.__id || ''),
          String(attachmentName),
        );

        return {
          ...attachmentInfo,
          data,
        };
      } else {
        const data = await context.db.attachment.get(
          getCouchDbId(d.__type, d.__id || ''),
          String(attachmentName),
        );

        return {
          ...attachmentInfo,
          data,
        };
      }
    };

  return getAttachmentFromDatum;
}
