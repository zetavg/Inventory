import { Image } from 'react-native';
import RNFS from 'react-native-fs';
import ImageResizer from 'react-native-image-resizer';
import crypto from 'react-native-quick-crypto';

import ImageEditor from '@react-native-community/image-editor';

export type ImageAsset = {
  base64?: string;
  uri?: string;
  width?: number;
  height?: number;
  fileSize?: number;
  type?: string;
  fileName?: string;
  duration?: number;
  bitrate?: number;
  timestamp?: string;
  id?: string;
};

export type ImageD = {
  contentType: 'image/jpeg' | 'image/png';
  data: string;
  digest?: string;
};

export async function processAssets(assets: ReadonlyArray<ImageAsset>) {
  const imageData = [];
  for (const asset of assets) {
    if (!asset) continue;
    const assetUri = asset.uri;
    if (!assetUri) continue;

    const fileName = asset.fileName;
    const isPng =
      asset.type === 'image/png' || assetUri.toLowerCase().endsWith('.png');
    const isJpg =
      asset.type === 'image/jpeg' ||
      assetUri.toLowerCase().endsWith('.jpg') ||
      assetUri.toLowerCase().endsWith('.jpeg');

    const imageDimensions = await new Promise<{
      width: number;
      height: number;
    }>((resolve, reject) => {
      Image.getSize(
        assetUri,
        (width, height) => {
          resolve({ width, height });
        },
        reject,
      );
    });

    const imageMinDimension = Math.min(
      imageDimensions.width,
      imageDimensions.height,
    );
    const imageMaxDimension = Math.max(
      imageDimensions.width,
      imageDimensions.height,
    );

    const [thumbnail128ContentType, thumbnail128Uri] = await (async () => {
      // Do not crop small PNG files since they might be a transparent-background icon
      if (isPng && imageMaxDimension <= 1024) {
        const { uri } = await ImageResizer.createResizedImage(
          assetUri,
          128,
          128,
          'PNG',
          80, // quality
          0,
          undefined,
          false,
          { mode: 'contain', onlyScaleDown: true },
        );

        return ['image/png' as const, uri];
      }

      const croppedImageUri = await ImageEditor.cropImage(assetUri, {
        size: { width: imageMinDimension, height: imageMinDimension },
        offset: {
          x:
            imageDimensions.width === imageMinDimension
              ? 0
              : (imageDimensions.width - imageMinDimension) / 2,
          y:
            imageDimensions.height === imageMinDimension
              ? 0
              : (imageDimensions.height - imageMinDimension) / 2,
        },
      });

      const { uri } = await ImageResizer.createResizedImage(
        croppedImageUri,
        128,
        128,
        'JPEG',
        80, // quality
        0,
        undefined,
        false,
        { mode: 'contain', onlyScaleDown: true },
      );

      return ['image/jpeg' as const, uri];
    })();
    const thumbnail128: ImageD = {
      contentType: thumbnail128ContentType,
      data: await base64FromFile(thumbnail128Uri),
    };

    // const { uri: thumbnail1024Uri } = await ImageResizer.createResizedImage(
    //   croppedImageUri || assetUri,
    //   1024,
    //   1024,
    //   isPng ? 'PNG' : 'JPEG',
    //   80, // quality
    //   0,
    //   undefined,
    //   false,
    //   { mode: 'contain', onlyScaleDown: true },
    // );
    // const thumbnail1024: ImageD = {
    //   contentType: isPng ? 'image/png' : 'image/jpeg',
    //   data: await base64FromFile(thumbnail1024Uri),
    // };

    const [image1440ContentType, image1440Uri] = await (async () => {
      if ((isJpg || isPng) && imageMaxDimension <= 1024) {
        return [
          isPng ? ('image/png' as const) : ('image/jpeg' as const),
          assetUri,
        ];
      }

      const { uri } = await ImageResizer.createResizedImage(
        assetUri,
        1440,
        1440,
        'JPEG',
        80, // quality
        0,
        undefined,
        false,
        { mode: 'contain', onlyScaleDown: true },
      );

      return ['image/jpeg' as const, uri];
    })();
    const image1440: ImageD = {
      contentType: image1440ContentType,
      data: await base64FromFile(image1440Uri),
    };
    image1440.digest =
      'md5-' +
      crypto
        .createHash('md5')
        .update(image1440.data, 'base64')
        .digest('base64');

    imageData.push({
      fileName,
      thumbnail128,
      // thumbnail1024,
      image1440,
    });
  }

  return imageData;
}

async function base64FromFile(uri: string) {
  return await RNFS.readFile(decodeURIComponent(uri), 'base64');
}

export default processAssets;
