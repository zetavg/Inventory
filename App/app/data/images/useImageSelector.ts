import { useCallback, useMemo } from 'react';
import { Alert, Platform } from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

import humanFileSize from '@app/utils/humanFileSize';

import useActionSheet from '@app/hooks/useActionSheet';

import { MenuAction } from '@app/components/Menu';

import processAssets, { ImageAsset, ImageD } from './processAssets';

type Options = {
  selectionLimit?: number;
  onUserSelectStart?: () => void;
  onUserSelected?: () => void;
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

  const getSelectImageActions = useCallback<
    (
      callback: (images: ReadonlyArray<ImageData> | null) => void,
      options: Options,
    ) => ReadonlyArray<MenuAction>
  >(
    (callback, options = {}) => [
      {
        title: 'Take Picture from Camera',
        sfSymbolName: 'camera',
        onPress: async () => {
          try {
            if (options.onUserSelectStart) options.onUserSelectStart();
            const assets = await takePictureFromCamera(options);
            if (!assets) {
              callback(null);
              return;
            }
            if (options.onUserSelected) options.onUserSelected();
            const images = await processAssets(assets);
            callback(images);
          } catch (e) {
            Alert.alert(
              'An Error Occurred',
              e instanceof Error ? e.message : 'unknown error',
            );
            callback(null);
          }
        },
      },
      {
        title: 'Select from Photo Library',
        sfSymbolName: 'photo.on.rectangle',
        onPress: async () => {
          try {
            if (options.onUserSelectStart) options.onUserSelectStart();
            const assets = await selectImageFromLibrary(options);
            if (!assets) {
              callback(null);
              return;
            }
            if (options.onUserSelected) options.onUserSelected();
            const images = await processAssets(assets);
            callback(images);
          } catch (e) {
            Alert.alert(
              'An Error Occurred',
              e instanceof Error ? e.message : 'unknown error',
            );
            callback(null);
          }
        },
      },
      {
        title: 'Select from Files',
        sfSymbolName: 'folder',
        onPress: async () => {
          try {
            if (options.onUserSelectStart) options.onUserSelectStart();
            const imageAssets = await selectImageFromFile(options);
            if (!imageAssets || imageAssets.length <= 0) {
              callback(null);
              return;
            }
            if (options.onUserSelected) options.onUserSelected();
            const images = await processAssets(imageAssets);
            callback(images);
          } catch (e) {
            Alert.alert(
              'An Error Occurred',
              e instanceof Error ? e.message : 'unknown error',
            );
            callback(null);
          }
        },
      },
    ],
    [selectImageFromFile, selectImageFromLibrary, takePictureFromCamera],
  );

  const selectImage = useCallback(
    (options: Options = {}): Promise<ReadonlyArray<ImageData> | null> => {
      return new Promise(resolve => {
        const actions = getSelectImageActions(resolve, options);
        showActionSheet(
          actions.map(a => ({
            name: a.title || '',
            onSelect: a.onPress || (() => {}),
          })),
          { onCancel: () => resolve(null) },
        );
      });
    },
    [getSelectImageActions, showActionSheet],
  );

  return { selectImage, getSelectImageActions };
}
