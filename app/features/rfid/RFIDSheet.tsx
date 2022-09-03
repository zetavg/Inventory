import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  StyleSheet,
  View,
  useWindowDimensions,
  Alert,
  Platform,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import {
  BottomSheetBackdrop,
  BottomSheetFooter,
  BottomSheetFooterProps,
  BottomSheetHandle,
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SFSymbol } from 'react-native-sfsymbols';

import Color from 'color';
import commonStyles from '@app/utils/commonStyles';
import InsetGroup from '@app/components/InsetGroup';
import Text from '@app/components/Text';
import Button from '@app/components/Button';
import ElevatedButton, {
  SecondaryButton,
} from '@app/components/ElevatedButton';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useForwardedRef from '@app/hooks/useForwardedRef';
import useIsDarkMode from '@app/hooks/useIsDarkMode';
import useColors from '@app/hooks/useColors';

import useDB from '@app/hooks/useDB';
import { ConfigStoredInDB } from '@app/db/types';
import { getConfigInDB } from '@app/db/configUtils';
import { ScanData } from '@app/modules/RFIDWithUHFBaseModule';
import RFIDWithUHFUARTModule from '@app/modules/RFIDWithUHFUARTModule';
import EPCUtils from '@app/modules/EPCUtils';
import { DataType } from '@app/db/schema';
import { getTagAccessPassword } from './utils';

export type RFIDSheetOptions =
  | {
      functionality: 'scan';
    }
  | {
      functionality: 'locate';
    }
  | {
      functionality: 'read';
    }
  | {
      functionality: 'write';
      epc: string;
      tagAccessPassword?: string;
    };

type Props = {
  rfidSheetPassOptionsFnRef: React.MutableRefObject<
    ((options: RFIDSheetOptions) => void) | null
  >;
};

const useBottomSheetDynamicSnapPoints = (
  initialSnapPoints: Array<string | number>,
) => {
  const windowDimensions = useWindowDimensions();
  const safeAreaInsets = useSafeAreaInsets();
  const maxHeight =
    windowDimensions.height - safeAreaInsets.top - safeAreaInsets.bottom - 8;

  // variables
  const animatedContentHeight = useSharedValue(0);
  const animatedHandleHeight = useSharedValue(-999);
  const animatedSnapPoints = useDerivedValue(() => {
    if (
      animatedHandleHeight.value === -999 ||
      animatedContentHeight.value === 0
    ) {
      return initialSnapPoints.map(() => -999);
    }
    let contentWithHandleHeight =
      animatedContentHeight.value + animatedHandleHeight.value;

    if (contentWithHandleHeight > maxHeight)
      contentWithHandleHeight = maxHeight;

    return initialSnapPoints.map(snapPoint =>
      snapPoint === 'CONTENT_HEIGHT' ? contentWithHandleHeight : snapPoint,
    );
  }, [maxHeight]);
  const animatedScrollViewStyles = useAnimatedStyle(() => {
    let contentWithHandleHeight =
      animatedContentHeight.value + animatedHandleHeight.value;

    if (contentWithHandleHeight > maxHeight)
      contentWithHandleHeight = maxHeight;

    return {
      height: contentWithHandleHeight,
    };
  });

  // callbacks
  const handleContentLayout = useCallback(
    ({
      nativeEvent: {
        layout: { height },
      },
    }: any) => {
      animatedContentHeight.value = height;
    },
    [animatedContentHeight],
  );

  return {
    animatedSnapPoints,
    animatedHandleHeight,
    animatedContentHeight,
    animatedScrollViewStyles,
    handleContentLayout,
  };
};

function RFIDSheet(
  { rfidSheetPassOptionsFnRef }: Props,
  ref: React.ForwardedRef<BottomSheetModal>,
) {
  const innerRef = useForwardedRef(ref);
  // Styles //
  const safeAreaInsets = useSafeAreaInsets();
  const isDarkMode = useIsDarkMode();
  const { sheetBackgroundColor, yellow2, red2, blue2 } = useColors();
  const insetGroupBackgroundColor = useMemo(
    () => Color(sheetBackgroundColor).lighten(0.5).hexa(),
    [sheetBackgroundColor],
  );

  // const footerBottomInset = safeAreaInsets.bottom + 32;
  const [footerHeight, setFooterHeight] = useState(0);
  const footerBottomInset = safeAreaInsets.bottom;
  const footerLinearGradientHeight = 52;
  const contentBottomInset =
    footerBottomInset + footerHeight + footerLinearGradientHeight / 2;

  const initialSnapPoints = useMemo(() => ['CONTENT_HEIGHT'], []);

  const {
    animatedHandleHeight,
    animatedSnapPoints,
    animatedContentHeight,
    animatedScrollViewStyles,
    handleContentLayout,
  } = useBottomSheetDynamicSnapPoints(initialSnapPoints);

  // Options Processing //
  const [options, setOptions] = useState<RFIDSheetOptions | null>(null);
  const handlePassedOptions = useCallback((opts: RFIDSheetOptions) => {
    // console.warn(`Got opts: ${JSON.stringify(opts)}`);
    setOptions(opts);
  }, []);
  rfidSheetPassOptionsFnRef.current = handlePassedOptions;

  // RFID Device Power Control //
  const [rfidReady, setRfidReady] = useState(false);
  const ready = rfidReady;

  const rfidLastFreedAt = useRef(0);
  const initRfid = useCallback(async () => {
    const lastFreedBefore = Date.now() - rfidLastFreedAt.current;
    if (lastFreedBefore < 5000) {
      console.warn(
        `RFID: Device is recently freed, wait ${
          5000 - lastFreedBefore
        } to init...`,
      );
      await new Promise(resolve => setTimeout(resolve, 5000 - lastFreedBefore));
    }

    if (Platform.OS === 'ios') {
      setRfidReady(true);
      return;
    }

    try {
      await RFIDWithUHFUARTModule.init();
      setRfidReady(true);
    } catch (e: any) {
      if (await RFIDWithUHFUARTModule.isPowerOn()) {
        setRfidReady(true);
      } else {
        Alert.alert('Cannot init RFID', e.message);
      }
    }
  }, []);
  const freeRfid = useCallback(() => {
    rfidLastFreedAt.current = Date.now();
    setRfidReady(false);
    console.warn('RFID: Freeing device...');
    try {
      RFIDWithUHFUARTModule.free();
    } catch (e) {
      // TODO: Log error
    }
  }, []);

  const freeRfidTimeout = useRef<NodeJS.Timeout | null>(null);
  const handleChange = useCallback(
    (index: number) => {
      if (index >= 0) {
        if (freeRfidTimeout.current) clearTimeout(freeRfidTimeout.current);
        if (!rfidReady) initRfid();
      }

      if (index < 0) {
        if (freeRfidTimeout.current) clearTimeout(freeRfidTimeout.current);
        const timer = setTimeout(() => {
          freeRfid();
        }, 30000);
        freeRfidTimeout.current = timer;
      }
    },
    [freeRfid, initRfid, rfidReady],
  );

  const handleDismiss = useCallback(() => {
    //   console.warn('Dismiss');
  }, []);

  // Configs from DB //
  const { db } = useDB();
  const [config, setConfig] = useState<ConfigStoredInDB | null>(null);
  const [defaultFilter, setDefaultFilter] = useState<string | null>(null);
  useEffect(() => {
    getConfigInDB(db).then(c => {
      setConfig(c);
      const [f] = EPCUtils.encodeHexEPC(
        `urn:epc:tag:giai-96:0.${c.epcCompanyPrefix}.${c.epcPrefix}`,
      );
      setDefaultFilter(f.slice(0, 8));
    });
  }, [db]);

  // Functionalities //

  const [scanStatus, setScanStatus] = useState('N/A');
  const [scannedData, setScannedData] = useState<Record<string, ScanData>>({});
  const [scannedDataCount, setScannedDataCount] = useState(0);

  const receiveScanData = useCallback((d: ScanData[]) => {
    setScannedData(data => ({
      ...data,
      ...Object.fromEntries(d.map(dd => [dd.epc, dd])),
    }));
    setScannedDataCount(c => c + d.length);
  }, []);

  const startScan = useCallback(async () => {
    const filterData = defaultFilter;
    try {
      setScanStatus('Starting scan...');
      await RFIDWithUHFUARTModule.startScan({
        power: 28,
        soundEnabled: true,
        callback: receiveScanData,
        scanRate: 30,
        eventRate: 250,
        filter: filterData
          ? {
              memoryBank: 'EPC',
              bitOffset: 32,
              bitCount: (filterData?.length || 0) * 4,
              data: filterData,
            }
          : undefined,
      });
      setScanStatus('Scanning');
    } catch (e: any) {
      setScanStatus(`Error: ${e?.message}`);
    }
  }, [defaultFilter, receiveScanData]);

  const stopScan = useCallback(async () => {
    try {
      setScanStatus('Stopping scan...');
      await RFIDWithUHFUARTModule.stopScan();
      setScanStatus('Scan stopped');
    } catch (e: any) {
      setScanStatus(`Error: ${e?.message}`);
    }
  }, []);

  const clearScannedData = useCallback(async () => {
    setScannedData({});
    setScannedDataCount(0);
    await RFIDWithUHFUARTModule.clearScannedTags();
  }, []);

  const [writeAndLockStatus, setWriteAndLockStatus] = useState('N/A');
  const [writeAndLockWorking, setWriteAndLockWorking] = useState(false);
  const [writeAndLockPower, setWriteAndLockPower] = useState<null | number>(8);
  const writeAndLock = useCallback(async () => {
    if (options?.functionality !== 'write') return;
    if (writeAndLockWorking) return;
    if (!config) return;

    setWriteAndLockWorking(true);

    const accessPassword = getTagAccessPassword(
      config.rfidTagAccessPassword,
      options.tagAccessPassword || '00000000',
      config.rfidTagAccessPasswordEncoding,
    );

    console.log(accessPassword);

    try {
      await RFIDWithUHFUARTModule.writeEpcAndLock(options.epc, accessPassword, {
        power: writeAndLockPower || 1,
        oldAccessPassword: '00000000',
        soundEnabled: true,
        reportStatus: setWriteAndLockStatus,
      });
    } catch (e: any) {
      // console.warn(e);
    } finally {
      setWriteAndLockWorking(false);
    }
  }, [writeAndLockWorking, options, config, writeAndLockPower]);
  const unlockAndReset = useCallback(async () => {
    if (options?.functionality !== 'write') return;
    if (writeAndLockWorking) return;
    if (!config) return;

    setWriteAndLockWorking(true);

    const accessPassword = getTagAccessPassword(
      config.rfidTagAccessPassword,
      options.tagAccessPassword || '00000000',
      config.rfidTagAccessPasswordEncoding,
    );

    try {
      await RFIDWithUHFUARTModule.resetEpcAndUnlock(accessPassword, {
        power: writeAndLockPower || 1,
        soundEnabled: true,
        reportStatus: setWriteAndLockStatus,
        // filter: enableFilter
        //   ? {
        //       memoryBank: filterMemoryBank,
        //       bitOffset: filterBitOffset || DEFAULTS.FILTER_BIT_OFFSET,
        //       bitCount: filterBitCount || DEFAULTS.FILTER_BIT_COUNT,
        //       data: filterData,
        //     }
        //   : undefined,
      });
    } catch (e: any) {
      // console.warn(e);
    } finally {
      setWriteAndLockWorking(false);
    }
  }, [writeAndLockWorking, options, config, writeAndLockPower]);

  const [dCounter, setDCounter] = useState(1);

  // Shared Event Handlers //
  const handleActionButtonPress = useCallback(() => {
    switch (options?.functionality) {
      case 'scan': {
        return;
      }
      case 'write': {
        return;
      }
      default:
        setDCounter(v => (v >= 4 ? 1 : v + 1));
    }
  }, [options?.functionality]);
  const handleActionButtonPressIn = useCallback(() => {
    switch (options?.functionality) {
      case 'scan': {
        return startScan();
      }
      case 'write': {
        return writeAndLock();
      }
    }
  }, [options?.functionality, startScan, writeAndLock]);
  const handleActionButtonPressOut = useCallback(() => {
    switch (options?.functionality) {
      case 'scan': {
        return stopScan();
      }
    }
  }, [options?.functionality, stopScan]);

  // Render //
  const Footer = useCallback(
    ({ animatedFooterPosition, ...props }: BottomSheetFooterProps) => {
      const buttonColor = (() => {
        switch (options?.functionality) {
          case 'write':
            return red2;

          case 'scan':
          case 'locate':
          default:
            return yellow2;
        }
      })();
      const buttonLabel = (() => {
        switch (options?.functionality) {
          case 'write':
            return 'Write';

          case 'scan':
            return 'Scan';

          default:
            return 'Go';
        }
      })();

      return (
        <BottomSheetFooter
          {...props}
          bottomInset={footerBottomInset}
          animatedFooterPosition={animatedFooterPosition}
        >
          <View
            style={[
              styles.sheetFooterBackgroundContainer,
              {
                top: -footerLinearGradientHeight,
                height: contentBottomInset + footerLinearGradientHeight,
              },
            ]}
          >
            <LinearGradient
              colors={[
                Color(sheetBackgroundColor).opaquer(-1).hexa(),
                sheetBackgroundColor,
              ]}
              style={[
                styles.sheetFooterLinearGradient,
                {
                  height: footerLinearGradientHeight,
                },
              ]}
            />
            <View
              style={[
                styles.sheetFooterBackground,
                {
                  top: footerLinearGradientHeight,
                  backgroundColor: sheetBackgroundColor,
                },
              ]}
            />
          </View>

          <View
            onLayout={event => {
              setFooterHeight(event.nativeEvent.layout.height);
            }}
            style={styles.sheetFooterContainer}
          >
            <ElevatedButton
              title={buttonLabel}
              color={buttonColor}
              onPress={handleActionButtonPress}
              onPressIn={handleActionButtonPressIn}
              onPressOut={handleActionButtonPressOut}
              down={(() => {
                switch (options?.functionality) {
                  case 'write':
                    return writeAndLockWorking;
                  default:
                    return false;
                }
              })()}
              disabled={(() => {
                if (!ready) return true;

                switch (options?.functionality) {
                  default:
                    return false;
                }
              })()}
              loading={(() => {
                if (!ready) return true;

                switch (options?.functionality) {
                  case 'write':
                    return writeAndLockWorking;
                  default:
                    return false;
                }
              })()}
            />
            <View
              style={{
                height: 100,
                flexDirection: 'row',
                paddingTop: safeAreaInsets.bottom / 2,
              }}
            >
              <View style={{ width: 100, justifyContent: 'center' }}>
                {(() => {
                  switch (options?.functionality) {
                    case 'scan':
                      return (
                        <SecondaryButton
                          title="Reset"
                          onPress={clearScannedData}
                        />
                      );
                    case 'write':
                      return (
                        <SecondaryButton
                          title="Wipe"
                          onPress={unlockAndReset}
                        />
                      );
                    default:
                      return null;
                  }
                })()}
              </View>
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <TouchableOpacity>
                  <View
                    style={{
                      opacity: 0.3,
                      flexDirection: 'row',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <BluetoothIcon size={21} />
                    <Text style={{ fontSize: 14, fontWeight: '500' }}>
                      Built-In UHF
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
              <View style={{ width: 100, justifyContent: 'center' }}>
                {(() => {
                  switch (options?.functionality) {
                    default:
                      return (
                        <SecondaryButton
                          title="Done"
                          onPress={() => innerRef.current?.dismiss()}
                        />
                      );
                  }
                })()}
              </View>
            </View>
          </View>
        </BottomSheetFooter>
      );
    },
    [
      clearScannedData,
      contentBottomInset,
      footerBottomInset,
      handleActionButtonPress,
      handleActionButtonPressIn,
      handleActionButtonPressOut,
      innerRef,
      options?.functionality,
      ready,
      red2,
      safeAreaInsets.bottom,
      sheetBackgroundColor,
      unlockAndReset,
      writeAndLockWorking,
      yellow2,
    ],
  );

  const renderHandle = useCallback(
    (props: React.ComponentProps<typeof BottomSheetHandle>) => (
      <BottomSheetHandle
        {...props}
        style={[
          styles.sheetHandle,
          {
            backgroundColor: sheetBackgroundColor,
          },
        ]}
        // eslint-disable-next-line react-native/no-inline-styles
        indicatorStyle={{
          backgroundColor: isDarkMode
            ? 'rgba(255, 255, 255, 0.5)'
            : 'rgba(0, 0, 0, 0.75)',
        }}
      />
    ),
    [isDarkMode, sheetBackgroundColor],
  );

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={initialSnapPoints.length - 2}
        appearsOnIndex={initialSnapPoints.length - 1}
        opacity={0.4}
        // pressBehavior="collapse"
        pressBehavior="close"
      />
    ),
    [initialSnapPoints.length],
  );

  return (
    <BottomSheetModal
      ref={innerRef}
      // detached={true}
      // style={{ marginHorizontal: 16 }}
      // bottomInset={safeAreaInsets.bottom + 32}
      index={initialSnapPoints.length - 1}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: sheetBackgroundColor }}
      handleComponent={renderHandle}
      backdropComponent={renderBackdrop}
      footerComponent={Footer}
      snapPoints={animatedSnapPoints}
      handleHeight={animatedHandleHeight}
      contentHeight={animatedContentHeight}
      style={[styles.modal, isDarkMode && styles.modalDarkMode]}
      onChange={handleChange}
      onDismiss={handleDismiss}
    >
      {(() => {
        switch (options?.functionality) {
          case 'scan': {
            const scannedItemsCount = Object.keys(scannedData).length;
            return (
              <BottomSheetScrollView
                style={animatedScrollViewStyles}
                // contentInset={{ bottom: contentBottomInset }}
              >
                <View
                  style={[
                    commonStyles.flex1,
                    commonStyles.pt16,
                    { paddingBottom: contentBottomInset },
                  ]}
                  onLayout={handleContentLayout}
                >
                  {scannedItemsCount <= 0 ? (
                    <InsetGroup
                      style={[
                        {
                          backgroundColor: insetGroupBackgroundColor,
                        },
                        commonStyles.centerChildren,
                        commonStyles.ph16,
                        commonStyles.pv40,
                      ]}
                    >
                      <Text>No Data</Text>
                      <Text>{scanStatus}</Text>
                    </InsetGroup>
                  ) : (
                    <InsetGroup
                      style={{
                        backgroundColor: insetGroupBackgroundColor,
                      }}
                      label={`${scannedItemsCount} Item${
                        scannedItemsCount > 1 ? 's' : ''
                      }`}
                      labelRight={
                        <InsetGroup.GroupLabelRightButton
                          label="Clear"
                          onPress={clearScannedData}
                        />
                      }
                    >
                      {Object.values(scannedData)
                        .flatMap(d => [
                          <ScannedItem key={d.epc} item={d} />,
                          <InsetGroup.ItemSeperator key={`s-${d.epc}`} />,
                        ])
                        .slice(0, -1)}
                    </InsetGroup>
                  )}
                </View>
              </BottomSheetScrollView>
            );
          }
          default:
            return (
              <BottomSheetScrollView
                style={animatedScrollViewStyles}
                // contentInset={{ bottom: contentBottomInset }}
              >
                <View
                  style={[
                    commonStyles.flex1,
                    commonStyles.pt16,
                    { paddingBottom: contentBottomInset },
                  ]}
                  onLayout={handleContentLayout}
                >
                  {Array.from(new Array(dCounter)).map((_, i) => (
                    <InsetGroup
                      key={i}
                      label="Info"
                      style={{
                        backgroundColor: insetGroupBackgroundColor,
                      }}
                    >
                      <InsetGroup.Item
                        label="RFID Status"
                        detail={rfidReady ? 'Ready' : 'Not Ready'}
                      />
                      <InsetGroup.ItemSeperator />
                      <InsetGroup.Item
                        label="Config Ready"
                        detail={config ? 'Yes' : 'No'}
                      />
                      <InsetGroup.ItemSeperator />
                      <InsetGroup.Item
                        label="Default Filter"
                        detail={defaultFilter}
                      />
                      <InsetGroup.ItemSeperator />
                      <InsetGroup.Item
                        label="Status"
                        detail={(() => {
                          if (options?.functionality === 'write') {
                            return writeAndLockStatus;
                          }
                          return 'null';
                        })()}
                      />
                      <InsetGroup.ItemSeperator />
                      <InsetGroup.Item
                        label="Options"
                        vertical2
                        detail={JSON.stringify(options, null, 2)}
                      />
                      <InsetGroup.ItemSeperator />
                      <InsetGroup.Item
                        label="Config"
                        vertical2
                        detail={JSON.stringify(config, null, 2)}
                      />
                    </InsetGroup>
                  ))}
                </View>
              </BottomSheetScrollView>
            );
        }
      })()}
      <LinearGradient
        colors={[
          sheetBackgroundColor,
          Color(sheetBackgroundColor).opaquer(-1).hexa(),
        ]}
        style={styles.sheetUpperLinearGradient}
      />
    </BottomSheetModal>
  );
}

function ScannedItem({ item }: { item: ScanData }) {
  const { db } = useDB();

  const [loadedItem, setLoadedItem] = useState<DataType<'item'> | null>(null);
  const loadItem = useCallback(async () => {
    try {
      const data = await db.find({
        use_index: 'index-field-actualRfidTagEpcMemoryBankContents',
        selector: {
          'data.actualRfidTagEpcMemoryBankContents': { $eq: item.epc },
        },
      });
      const doc = (data as any)?.docs && (data as any)?.docs[0];
      if (
        doc &&
        typeof (doc as any)?._id === 'string' &&
        (doc as any)?._id.startsWith('item-')
      )
        setLoadedItem((doc as any).data);
    } catch (e) {
      // TODO: Handle other error
    }
  }, [db, item.epc]);
  useEffect(() => {
    loadItem();
  }, [loadItem]);

  const [loadedItemCollection, setLoadedItemCollection] =
    useState<DataType<'collection'> | null>(null);
  const loadItemCollection = useCallback(async () => {
    if (!loadedItem) return;

    try {
      const data = await db.get(`collection-2-${loadedItem.collection}`);
      if (
        data &&
        typeof (data as any)?._id === 'string' &&
        (data as any)?._id.startsWith('collection-')
      )
        setLoadedItemCollection((data as any).data);
    } catch (e) {
      // TODO: Handle other error
    }
  }, [db, loadedItem]);

  useEffect(() => {
    if (!loadedItem) return;
    if (!loadedItem.collection) return;
    loadItemCollection();
  }, [loadItemCollection, loadedItem]);

  if (loadedItem) {
    return (
      <InsetGroup.Item
        key={item.epc}
        label={loadedItem.name}
        vertical
        detail={[
          item.rssi && `RSSI: ${item.rssi}`,
          loadedItemCollection && loadedItemCollection.name,
          loadedItem.individualAssetReference &&
            `${loadedItem.individualAssetReference}`,
        ]
          .filter(s => s)
          .join(' | ')}
      />
    );
  }

  return (
    <InsetGroup.Item
      key={item.epc}
      label={item.epc}
      vertical
      detail={[
        item.rssi && `RSSI: ${item.rssi}`,
        item.tid && `TID: ${item.tid}`,
      ]
        .filter(s => s)
        .join(', ')}
    />
  );
}

function BluetoothIcon({
  color,
  size,
  opacity,
}: {
  color?: string;
  size?: number;
  opacity?: number;
}) {
  const { contentTextColor } = useColors();
  const c = color || contentTextColor;
  return (
    <Icon
      name="bluetooth"
      size={size || 16}
      color={c}
      style={{ opacity: opacity || 0.9 }}
    />
  );
}

const styles = StyleSheet.create({
  modal: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.58,
    shadowRadius: 16.0,

    elevation: 24,
  },
  modalDarkMode: {
    borderWidth: 1 + StyleSheet.hairlineWidth,
    borderColor: '#eeeeee16',
    borderRadius: 12,
    marginHorizontal: -1 - StyleSheet.hairlineWidth,
  },
  sheetHandle: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  sheetUpperLinearGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 16,
  },
  sheetFooterBackgroundContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  sheetFooterBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheetFooterLinearGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
  sheetFooterContainer: {
    paddingHorizontal: 16,
  },
});

export default React.forwardRef(RFIDSheet);
