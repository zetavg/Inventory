import { useCallback } from 'react';
import { Alert, Image, Platform } from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import ImageResizer from 'react-native-image-resizer';
import crypto from 'react-native-quick-crypto';

import ImageEditor from '@react-native-community/image-editor';

import humanFileSize from '@app/utils/humanFileSize';

import useActionSheet from '@app/hooks/useActionSheet';

type Options = {
  selectionLimit?: number;
  onUserSelectStart?: () => void;
  onUserSelected?: () => void;
};

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

type ImageD = {
  contentType: 'image/jpeg' | 'image/png';
  data: string;
  digest?: string;
};

export type ImageData = {
  fileName?: string;
  thumbnail128: ImageD;
  // thumbnail1024: ImageD;
  image1440: ImageD;
};

export default function useImageSelector() {
  const { showActionSheet } = useActionSheet();

  const takePictureFromCamera = useCallback(
    async (
      options: Options = {},
    ): Promise<ReadonlyArray<ImageAsset> | null> => {
      const result = await launchCamera({
        mediaType: 'photo',
        saveToPhotos: false,
        maxWidth: 1024,
        maxHeight: 1024,
        includeBase64: false,
        presentationStyle: 'fullScreen',
      });

      if (result.didCancel) return null;

      if (result.errorCode) {
        Alert.alert(`Error ${result.errorCode}`, result.errorMessage);
        return null;
      }

      return result.assets || null;
    },
    [],
  );

  const selectImageFromLibrary = useCallback(
    async (
      options: Options = {},
    ): Promise<ReadonlyArray<ImageAsset> | null> => {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: options.selectionLimit || 1,
        maxWidth: 2048,
        maxHeight: 2048,
        includeBase64: false,
      });

      if (result.didCancel) return null;

      if (result.errorCode) {
        Alert.alert(`Error ${result.errorCode}`, result.errorMessage);
        return null;
      }

      return result.assets || null;
    },
    [],
  );

  const selectImageFromFile = useCallback(
    async (
      options: Options = {},
    ): Promise<ReadonlyArray<ImageAsset> | null> => {
      try {
        let files = await DocumentPicker.pick({
          allowMultiSelection: true,
          type:
            Platform.OS === 'ios'
              ? [
                  'public.png',
                  'public.jpeg',
                  'org.webmproject.webp',
                  'public.heic',
                  'public.heif',
                ]
              : ['image/*'],
        });
        const fileTooLargeErrorFileSizes: Array<number> = [];

        files = files.filter(file => {
          const isFileTooLarge = (file.size || 0) > 67108864;
          if (isFileTooLarge) {
            fileTooLargeErrorFileSizes.push(file.size || 0);
          }
          return !isFileTooLarge;
        });
        if (fileTooLargeErrorFileSizes.length > 0) {
          Alert.alert(
            'File Size is Too Large',
            `Some of the selected files are too large. Maximum size is 64 MB, got file sizes: ${fileTooLargeErrorFileSizes
              .map(s => humanFileSize(s))
              .join(', ')}.`,
          );
        }

        if (files.length > (options.selectionLimit || 1)) {
          files = files.slice(0, options.selectionLimit || 1);

          Alert.alert(
            'Too Many Files Selected',
            `You can select up to ${
              options.selectionLimit || 1
            } files. Some files are ignored.`,
          );
        }

        return files.map(f => ({ fileName: f.name || undefined, uri: f.uri }));
      } catch (e) {
        if (e instanceof Error) {
          // User canceled the document picker
          if ((e as any).code === 'DOCUMENT_PICKER_CANCELED') return null;
        }

        throw e;
      }
    },
    [],
  );

  const selectImage = useCallback(
    (options: Options = {}): Promise<ReadonlyArray<ImageData> | null> => {
      return new Promise(resolve => {
        showActionSheet(
          [
            {
              name: 'Take Picture from Camera',
              onSelect: async () => {
                try {
                  if (options.onUserSelectStart) options.onUserSelectStart();
                  const assets = await takePictureFromCamera(options);
                  if (!assets) {
                    resolve(null);
                    return;
                  }
                  if (options.onUserSelected) options.onUserSelected();
                  const images = await processAssets(assets);
                  resolve(images);
                } catch (e) {
                  Alert.alert(
                    'An Error Occurred',
                    e instanceof Error ? e.message : 'unknown error',
                  );
                  resolve(null);
                }
              },
            },
            {
              name: 'Select from Photo Library',
              onSelect: async () => {
                try {
                  if (options.onUserSelectStart) options.onUserSelectStart();
                  const assets = await selectImageFromLibrary(options);
                  if (!assets) {
                    resolve(null);
                    return;
                  }
                  if (options.onUserSelected) options.onUserSelected();
                  const images = await processAssets(assets);
                  resolve(images);
                } catch (e) {
                  Alert.alert(
                    'An Error Occurred',
                    e instanceof Error ? e.message : 'unknown error',
                  );
                  resolve(null);
                }
              },
            },
            {
              name: 'Select from Files',
              onSelect: async () => {
                try {
                  if (options.onUserSelectStart) options.onUserSelectStart();
                  const imageAssets = await selectImageFromFile(options);
                  if (!imageAssets || imageAssets.length <= 0) {
                    resolve(null);
                    return;
                  }
                  if (options.onUserSelected) options.onUserSelected();
                  const images = await processAssets(imageAssets);
                  resolve(images);
                } catch (e) {
                  Alert.alert(
                    'An Error Occurred',
                    e instanceof Error ? e.message : 'unknown error',
                  );
                  resolve(null);
                }
              },
            },
          ],
          { onCancel: () => resolve(null) },
        );
      });
    },
    [
      selectImageFromFile,
      selectImageFromLibrary,
      showActionSheet,
      takePictureFromCamera,
    ],
  );

  return selectImage;
}

async function processAssets(assets: ReadonlyArray<ImageAsset>) {
  const imageData = [];
  for (const asset of assets) {
    if (!asset) continue;
    const assetUri = asset.uri;
    if (!assetUri) continue;

    const fileName = asset.fileName;
    const isPng = assetUri.toLowerCase().endsWith('.png');
    const isJpg =
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
