import { AttachAttachmentToDatum } from '@invt/data/types';

import { Context } from './types';

export default function getAttachAttachmentToDatum(
  context: Context,
): AttachAttachmentToDatum {
  const attachAttachmentToDatum: AttachAttachmentToDatum =
    async function attachAttachmentToDatum(
      d,
      attachmentName,
      contentType,
      data,
    ) {
      if (!d.__raw || typeof d.__raw !== 'object') {
        d.__raw = {};
      }

      if (
        !(d.__raw as any)._attachments ||
        typeof (d.__raw as any)._attachments !== 'object'
      ) {
        (d.__raw as any)._attachments = {};
      }

      (d.__raw as any)._attachments[attachmentName] = {
        content_type: contentType,
        data,
      };

      d.__updated_at = Date.now();

      return d;
    };

  return attachAttachmentToDatum;
}
