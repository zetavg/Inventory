import { GetAllAttachmentInfoFromDatum } from '@deps/data/types';

import getGetDatum from './getGetDatum';
import { Context } from './types';

export default function getGetAllAttachmentInfoFromDatum(
  context: Context,
): GetAllAttachmentInfoFromDatum {
  const getDatum = getGetDatum(context);
  const getAllAttachmentInfoFromDatum: GetAllAttachmentInfoFromDatum =
    async function getAllAttachmentInfoFromDatum(d) {
      const rawDoc = await (async () => {
        if (
          !d.__raw ||
          typeof d.__raw !== 'object' ||
          !(d.__raw as any)._attachments ||
          typeof (d.__raw as any)._attachments !== 'object'
        ) {
          return (await getDatum(d.__type, d.__id || ''))?.__raw;
        }

        return d.__raw;
      })();

      if (!rawDoc || typeof rawDoc !== 'object') {
        throw new Error(`Expect __raw to be an object, got ${typeof rawDoc}`);
      }
      const attachments = (rawDoc as any)._attachments;

      if (!attachments || typeof attachments !== 'object') {
        return {};
      }

      return Object.fromEntries(
        Object.entries(attachments).map(([n, attachmentInfo]: any) => {
          const content_type = attachmentInfo.content_type;
          if (typeof content_type !== 'string') {
            throw new Error(
              `Expect content_type to be a string, got ${typeof content_type}`,
            );
          }
          const size = attachmentInfo.length;
          if (typeof size !== 'number') {
            throw new Error(`Expect size to be a number, got ${typeof size}`);
          }
          const digest = attachmentInfo.digest;
          if (digest && typeof digest !== 'string') {
            throw new Error(
              `Expect digest to be a string, got ${typeof digest}`,
            );
          }

          return [
            n,
            {
              content_type,
              size,
              digest,
            },
          ];
        }),
      );
    };

  return getAllAttachmentInfoFromDatum;
}
