import { AttachAttachmentToDatum, GetData, SaveDatum } from '../types';
import { onlyValid } from '../utils';

import processAssets from './processAssets';

export default async function getImageDatum(
  image: Awaited<ReturnType<typeof processAssets>>[number],
  {
    getData,
    attachAttachmentToDatum,
    saveDatum,
  }: {
    getData: GetData;
    attachAttachmentToDatum: AttachAttachmentToDatum;
    saveDatum: SaveDatum;
  },
) {
  const image1440Digest = image.image1440.digest;
  if (image1440Digest) {
    // Reuse already-saved image if possible
    const existingImage = await getData(
      'image',
      {
        image_1440_digest: image1440Digest,
      },
      { limit: 1 },
    );

    const validExistingImage = onlyValid(existingImage);
    if (validExistingImage.length >= 1) {
      return validExistingImage[0];
    }
  }

  const imageToSave = {
    __type: 'image',
    filename: image.fileName,
  } as const;

  await attachAttachmentToDatum(
    imageToSave,
    'thumbnail-128',
    image.thumbnail128.contentType,
    image.thumbnail128.data,
  );
  // await attachAttachmentToDatum(
  //   imageToSave,
  //   'thumbnail-1024',
  //   itemImageDataItem.thumbnail1024.contentType,
  //   itemImageDataItem.thumbnail1024.data,
  // );
  await attachAttachmentToDatum(
    imageToSave,
    'image-1440',
    image.image1440.contentType,
    image.image1440.data,
  );

  return await saveDatum(imageToSave, {
    ignoreConflict: true,
  });
}
