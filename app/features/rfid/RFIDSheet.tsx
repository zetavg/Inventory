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

import Color from 'color';
import commonStyles from '@app/utils/commonStyles';
import InsetGroup from '@app/components/InsetGroup';
import Text from '@app/components/Text';
import ElevatedButton from '@app/components/ElevatedButton';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useIsDarkMode from '@app/hooks/useIsDarkMode';
import useColors from '@app/hooks/useColors';

import useDB from '@app/hooks/useDB';
import { ConfigStoredInDB } from '@app/db/types';
import { getConfigInDB } from '@app/db/configUtils';
import RFIDWithUHFUARTModule, {
  ScanData,
} from '@app/modules/RFIDWithUHFUARTModule';
import EPCUtils from '@app/modules/EPCUtils';

export type RFIDSheetOptions = {
  functionality: 'scan' | 'locate' | 'read' | 'write';
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
        }, 5000);
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
      // setDefaultFilter(f.slice(0, 8));
    });
  }, [config, db]);

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

  const [dCounter, setDCounter] = useState(1);

  // Shared Event Handlers //
  const handleActionButtonPress = useCallback(() => {
    switch (options?.functionality) {
      case 'scan': {
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
    }
  }, [options?.functionality, startScan]);
  const handleActionButtonPressOut = useCallback(() => {
    switch (options?.functionality) {
      case 'scan': {
        return stopScan();
      }
    }
  }, [options?.functionality, stopScan]);

  // Render //
  const footerBottomInset = safeAreaInsets.bottom + 80;
  const footerLinearGradientHeight = 52;
  const contentBottomInset =
    footerBottomInset + footerHeight + footerLinearGradientHeight / 2;
  const Footer = useCallback(
    ({ animatedFooterPosition }: BottomSheetFooterProps) => {
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
              disabled={!ready}
              loading={!ready}
              onPress={handleActionButtonPress}
              onPressIn={handleActionButtonPressIn}
              onPressOut={handleActionButtonPressOut}
            />
          </View>
        </BottomSheetFooter>
      );
    },
    [
      contentBottomInset,
      footerBottomInset,
      handleActionButtonPress,
      handleActionButtonPressIn,
      handleActionButtonPressOut,
      options?.functionality,
      ready,
      red2,
      sheetBackgroundColor,
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
      ref={ref}
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
          case 'scan':
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
                  {Object.keys(scannedData).length <= 0 ? (
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
                      label="hi"
                      labelRight={
                        <InsetGroup.GroupLabelRightButton
                          label="Clear"
                          onPress={clearScannedData}
                        />
                      }
                    >
                      {Object.values(scannedData)
                        .flatMap(d => [
                          <InsetGroup.Item
                            key={d.epc}
                            label={d.epc}
                            vertical
                            detail={[
                              d.rssi && `RSSI: ${d.rssi}`,
                              d.tid && `TID: ${d.tid}`,
                            ]
                              .filter(s => s)
                              .join(', ')}
                          />,
                          <InsetGroup.ItemSeperator key={`s-${d.epc}`} />,
                        ])
                        .slice(0, -1)}
                    </InsetGroup>
                  )}
                </View>
              </BottomSheetScrollView>
            );
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
                        label="Options"
                        vertical2
                        detail={JSON.stringify(options, null, 2)}
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
