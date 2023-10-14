import { useCallback } from 'react';
import { Alert, Image, Platform } from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import ImageResizer from 'react-native-image-resizer';

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
};

export type ImageData = {
  fileName?: string;
  thumbnail128: ImageD;
  thumbnail1024: ImageD;
  image2048: ImageD;
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
        maxWidth: 1024,
        maxHeight: 1024,
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
    ): Promise<{ name: string | null; uri: string } | null> => {
      try {
        const { uri, name, type, size } = await DocumentPicker.pickSingle({
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
        if ((size || 0) > 5242880) {
          Alert.alert(
            'File Size is Too Large',
            `Maximum size is 5 MB, got ${humanFileSize(size || 0)}.`,
          );
          return null;
        }
        return { name, uri };
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
                  const file = await selectImageFromFile(options);
                  if (!file) {
                    resolve(null);
                    return;
                  }
                  if (options.onUserSelected) options.onUserSelected();
                  const images = await processAssets([
                    { fileName: file.name || undefined, uri: file.uri },
                  ]);
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

    const croppedImageUri = isPng // Do not crop PNG files since they might be a transparent-background icon
      ? null
      : await ImageEditor.cropImage(assetUri, {
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

    const { uri: thumbnail128Uri } = await ImageResizer.createResizedImage(
      croppedImageUri || assetUri,
      128,
      128,
      isPng ? 'PNG' : 'JPEG',
      80, // quality
      0,
      undefined,
      false,
      { mode: 'contain', onlyScaleDown: true },
    );
    const thumbnail128: ImageD = {
      contentType: isPng ? 'image/png' : 'image/jpeg',
      data: await base64FromFile(thumbnail128Uri),
    };

    const { uri: thumbnail1024Uri } = await ImageResizer.createResizedImage(
      croppedImageUri || assetUri,
      1024,
      1024,
      isPng ? 'PNG' : 'JPEG',
      80, // quality
      0,
      undefined,
      false,
      { mode: 'contain', onlyScaleDown: true },
    );
    const thumbnail1024: ImageD = {
      contentType: isPng ? 'image/png' : 'image/jpeg',
      data: await base64FromFile(thumbnail1024Uri),
    };

    const image2048Uri = await (async () => {
      if ((isJpg || isPng) && imageMaxDimension <= 2048) {
        return assetUri;
      }

      const { uri } = await ImageResizer.createResizedImage(
        assetUri,
        2048,
        2048,
        'JPEG',
        80, // quality
        0,
        undefined,
        false,
        { mode: 'contain', onlyScaleDown: true },
      );

      return uri;
    })();
    const image2048: ImageD = {
      contentType: 'image/jpeg',
      data: await base64FromFile(image2048Uri),
    };

    imageData.push({
      fileName,
      thumbnail128,
      thumbnail1024,
      image2048,
    });
  }

  return imageData;
}

async function base64FromFile(uri: string) {
  return await RNFS.readFile(decodeURIComponent(uri), 'base64');
}
