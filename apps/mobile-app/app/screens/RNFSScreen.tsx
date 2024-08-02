import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import RNFS from 'react-native-fs';

import commonStyles from '@app/utils/commonStyles';

import type { StackParamList } from '@app/navigation/MainStack';

import useActionSheet from '@app/hooks/useActionSheet';
import useColors from '@app/hooks/useColors';

import InsetGroup from '@app/components/InsetGroup';
import ScreenContent from '@app/components/ScreenContent';
import ScreenContentScrollView from '@app/components/ScreenContentScrollView';
import Text from '@app/components/Text';
RNFS.DocumentDirectoryPath;
const DEFAULT_PATH = Platform.select({
  // ios: {
  //   name: 'RNFS.MainBundlePath',
  //   value: RNFS.MainBundlePath,
  // },
  // android: {
  //   name: 'RNFS.DocumentDirectoryPath',
  //   value: RNFS.DocumentDirectoryPath,
  // },
  default: {
    name: 'RNFS.DocumentDirectoryPath',
    value: RNFS.DocumentDirectoryPath,
  },
});

function RNFSScreen({ navigation }: StackScreenProps<StackParamList, 'RNFS'>) {
  const { showActionSheet } = useActionSheet();
  const { iosTintColor } = useColors();
  const [path, setPath] = useState(DEFAULT_PATH?.value || '');
  const [result, setResult] = useState<undefined | Object>(undefined);

  const handleShowPathSelect = useCallback(async () => {
    showActionSheet([
      {
        name: 'RNFS.DocumentDirectoryPath',
        onSelect: () => {
          setPath(RNFS.DocumentDirectoryPath);
        },
      },
      {
        name: 'RNFS.MainBundlePath',
        onSelect: () => {
          setPath(RNFS.MainBundlePath);
        },
      },
      {
        name: 'RNFS.PicturesDirectoryPath',
        onSelect: () => {
          setPath(RNFS.PicturesDirectoryPath);
        },
      },
      {
        name: 'RNFS.DownloadDirectoryPath',
        onSelect: () => {
          setPath(RNFS.DownloadDirectoryPath);
        },
      },
      {
        name: 'RNFS.LibraryDirectoryPath',
        onSelect: () => {
          setPath(RNFS.LibraryDirectoryPath);
        },
      },
      {
        name: 'RNFS.TemporaryDirectoryPath',
        onSelect: () => {
          setPath(RNFS.TemporaryDirectoryPath);
        },
      },
      {
        name: 'RNFS.ExternalDirectoryPath',
        onSelect: () => {
          setPath(RNFS.ExternalDirectoryPath);
        },
      },
      {
        name: 'RNFS.ExternalStorageDirectoryPath',
        onSelect: () => {
          setPath(RNFS.ExternalStorageDirectoryPath);
        },
      },
      {
        name: 'RNFS.CachesDirectoryPath',
        onSelect: () => {
          setPath(RNFS.CachesDirectoryPath);
        },
      },
      {
        name: 'RNFS.ExternalCachesDirectoryPath',
        onSelect: () => {
          setPath(RNFS.ExternalCachesDirectoryPath);
        },
      },
    ]);
  }, [showActionSheet]);

  const handleReadDir = useCallback(async () => {
    const p = path;

    if (!p) {
      Alert.alert('Error', 'Path is empty.');
      return;
    }

    try {
      const r = await RNFS.readDir(p);
      setResult(r);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }, [path]);

  // const handleDeleteAll = useCallback(async () => {
  //   const p = path;

  //   if (!p) {
  //     Alert.alert('Error', 'Path is empty.');
  //     return;
  //   }

  //   try {
  //     const r = await RNFS.readDir(p);
  //     // Danger!
  //     r.map(rr => RNFS.unlink(rr.path));
  //     setResult(r);
  //   } catch (e: any) {
  //     Alert.alert('Error', e.message);
  //   }
  // }, [path]);

  const scrollViewRef = useRef<ScrollView>(null);

  return (
    <ScreenContent navigation={navigation} title="RNFS">
      <ScreenContentScrollView ref={scrollViewRef}>
        <View style={commonStyles.mt16} />
        <InsetGroup
          label="Read-dir"
          labelRight={
            <TouchableOpacity onPress={handleShowPathSelect}>
              <Text
                style={{
                  fontSize: InsetGroup.GROUP_LABEL_FONT_SIZE,
                  color: iosTintColor,
                }}
              >
                Select...
              </Text>
            </TouchableOpacity>
          }
        >
          <InsetGroup.Item
            label="Path"
            vertical2
            detail={
              <InsetGroup.TextInput
                style={commonStyles.devToolsMonospaced}
                // placeholder={
                //   DEFAULT_PATH
                //     ? `${DEFAULT_PATH.name} (${DEFAULT_PATH.value})`
                //     : undefined
                // }
                autoCapitalize="none"
                returnKeyType="done"
                value={path}
                onChangeText={setPath}
                // onFocus={ScreenContentScrollView.stf(scrollViewRef, -1000)}
              />
            }
          />
          <InsetGroup.ItemSeparator />
          <InsetGroup.Item label="readDir" button onPress={handleReadDir} />
        </InsetGroup>

        <InsetGroup label="Result">
          <InsetGroup.Item
            label="Result"
            vertical2
            detailTextStyle={commonStyles.devToolsMonospaced}
            detail={
              result === undefined
                ? '(undefined)'
                : JSON.stringify(result, null, 2)
            }
          />
        </InsetGroup>
      </ScreenContentScrollView>
    </ScreenContent>
  );
}

export default RNFSScreen;
