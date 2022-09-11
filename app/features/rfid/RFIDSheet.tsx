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
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  ScrollView,
  useWindowDimensions,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { AutoSizeText, ResizeTextMode } from 'react-native-auto-size-text';
import Slider from '@react-native-community/slider';
import LinearGradient from 'react-native-linear-gradient';
import Modal from 'react-native-modal';

import {
  BottomSheetBackdrop,
  BottomSheetFooter,
  BottomSheetFooterProps,
  BottomSheetHandle,
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import Color from 'color';
import commonStyles from '@app/utils/commonStyles';
import InsetGroup from '@app/components/InsetGroup';
import Text from '@app/components/Text';
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
import useBottomSheetDynamicSnapPoints from './hooks/useBottomSheetDynamicSnapPoints';
import { usePersistedState } from '@app/hooks/usePersistedState';
import RFIDWithUHFBLEModule, {
  DeviceConnectStatusPayload,
  ScanDevicesData,
} from '@app/modules/RFIDWithUHFBLEModule';

export type RFIDSheetOptions =
  | {
      functionality: 'scan';
    }
  | {
      functionality: 'locate';
      epc: string;
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

const ACTION_BUTTON_PRESS_RETENTION_OFFSET = {
  top: 512,
  bottom: 64,
  left: 32,
  right: 32,
};

function RFIDSheet(
  { rfidSheetPassOptionsFnRef }: Props,
  ref: React.ForwardedRef<BottomSheetModal>,
) {
  const innerRef = useForwardedRef(ref);
  // #region Styles //
  const windowDimensions = useWindowDimensions();
  const safeAreaInsets = useSafeAreaInsets();
  const isDarkMode = useIsDarkMode();
  const {
    sheetBackgroundColor,
    contentSecondaryTextColor,
    green2,
    yellow2,
    orange2,
    red2,
    blue2,
  } = useColors();
  const insetGroupBackgroundColor = useMemo(
    () => Color(sheetBackgroundColor).lighten(0.5).hexa(),
    [sheetBackgroundColor],
  );

  const [footerHeight, setFooterHeight] = useState(0);
  const footerBottomInset = safeAreaInsets.bottom;
  const footerLinearGradientHeight = 32;
  const contentBottomInset =
    footerBottomInset + footerHeight + footerLinearGradientHeight / 10;

  const initialSnapPoints = useMemo(() => ['CONTENT_HEIGHT'], []);

  const {
    animatedHandleHeight,
    animatedSnapPoints,
    animatedContentHeight,
    animatedScrollViewStyles,
    handleContentLayout,
  } = useBottomSheetDynamicSnapPoints(initialSnapPoints);
  // #endregion //

  // #region Options Processing //
  const [options, setOptions] = useState<RFIDSheetOptions | null>(null);
  const handlePassedOptions = useCallback((opts: RFIDSheetOptions) => {
    setOptions(opts);
  }, []);
  rfidSheetPassOptionsFnRef.current = handlePassedOptions;
  // #endregion //

  // #region Sheet Open/Close Handlers //
  const [sheetOpened, setSheetOpened] = useState(false);
  const [devShowDetailsCounter, setDevShowDetailsCounter] = useState(0);
  const handleChange = useCallback((index: number) => {
    if (index >= 0) {
      setSheetOpened(true);
    }

    if (index < 0) {
      setSheetOpened(false);
      setDevShowDetailsCounter(0);
    }
  }, []);

  const handleDismiss = useCallback(() => {
    //   console.warn('Dismiss');
  }, []);
  // #endregion //

  // #region RFID Device Connect & Power Control //

  const [useBuiltinReader, setUseBuiltinReader] = usePersistedState(
    'RFIDSheet-useBuiltinReader',
    false,
  );

  const [isWorking, setIsWorking] = useState(false);

  // Built-in Reader

  const [builtinReaderPowerOn, setBuiltinReaderPowerOn] = useState(false);
  const [builtinReaderAutoFree, setBuiltinReaderAutoFree] = useState(true);
  const [builtinReaderAutoFreeTimeout, setBuiltinReaderAutoFreeTimeout] =
    useState(180);
  const rfidLastFreedAt = useRef(0);
  const initBuiltinRfid = useCallback(async () => {
    if (await RFIDWithUHFUARTModule.isPowerOn()) {
      setBuiltinReaderPowerOn(true);
      return;
    }

    const lastFreedBefore = Date.now() - rfidLastFreedAt.current;
    if (lastFreedBefore < 5000) {
      // console.warn(
      //   `RFID: Device is recently freed, wait ${
      //     5000 - lastFreedBefore
      //   } to init...`,
      // );
      await new Promise(resolve => setTimeout(resolve, 5000 - lastFreedBefore));
    }

    try {
      await RFIDWithUHFUARTModule.init();
      setBuiltinReaderPowerOn(await RFIDWithUHFUARTModule.isPowerOn());
    } catch (e: any) {
      setBuiltinReaderPowerOn(await RFIDWithUHFUARTModule.isPowerOn());
    }
  }, []);
  const freeBuiltinRfid = useCallback(async () => {
    rfidLastFreedAt.current = Date.now();
    setBuiltinReaderPowerOn(false);
    try {
      // console.warn('freeBuiltinRfid');
      RFIDWithUHFUARTModule.free();
    } catch (e) {
      // TODO: Log error
    }
  }, []);

  const freeBuiltinRfidTimer = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (sheetOpened) {
      if (!useBuiltinReader) return;
      if (freeBuiltinRfidTimer.current)
        clearTimeout(freeBuiltinRfidTimer.current);
      initBuiltinRfid();
    } else {
      if (freeBuiltinRfidTimer.current)
        clearTimeout(freeBuiltinRfidTimer.current);
      if (builtinReaderAutoFree) {
        const timer = setTimeout(() => {
          freeBuiltinRfid();
        }, builtinReaderAutoFreeTimeout * 1000);
        freeBuiltinRfidTimer.current = timer;
      }
    }
  }, [
    builtinReaderAutoFree,
    builtinReaderAutoFreeTimeout,
    freeBuiltinRfid,
    initBuiltinRfid,
    sheetOpened,
    useBuiltinReader,
  ]);

  // BLE Reader

  const [scanBleDevicesData, setScanBleDevicesData] = useState<
    Record<string, ScanDevicesData>
  >({});
  const receiveScanDeviceData = useCallback((d: ScanDevicesData[]) => {
    setScanBleDevicesData(data => ({
      ...data,
      ...Object.fromEntries(d.map(dd => [dd.address, dd])),
    }));
  }, []);
  const scanBleDevices = useCallback(async () => {
    setScanBleDevicesData({});
    RFIDWithUHFBLEModule.scanDevices(true, { callback: receiveScanDeviceData });
  }, [receiveScanDeviceData]);
  const stopScanBleDevices = useCallback(async () => {
    RFIDWithUHFBLEModule.scanDevices(false, {
      callback: receiveScanDeviceData,
    });
  }, [receiveScanDeviceData]);
  const clearScanDevicesData = useCallback(async () => {
    setScanBleDevicesData({});
  }, []);

  const [pairedBleDeviceAddress, setPairedBleDeviceAddress] = usePersistedState<
    null | string
  >('RFIDSheet-pairedBleDeviceAddress', null);
  const [pairedBleDeviceName, setPairedBleDeviceName] = usePersistedState<
    null | string
  >('RFIDSheet-pairedBleDeviceName', null);

  const pairDevice = useCallback(
    (d: ScanDevicesData) => {
      clearScanDevicesData();
      setPairedBleDeviceAddress(d.address);
      setPairedBleDeviceName(d.name || d.address);
      setBleDeviceConnectionStatus(null);
      setShowReaderSetup(false);
    },
    [clearScanDevicesData, setPairedBleDeviceAddress, setPairedBleDeviceName],
  );

  const [bleDeviceConnectionStatus, setBleDeviceConnectionStatus] =
    useState<DeviceConnectStatusPayload | null>(null);
  const prevBleDeviceConnectionStatus =
    useRef<DeviceConnectStatusPayload | null>(null);
  const [bleDeviceBatteryLevel, setBleDeviceBatteryLevel] = useState<
    null | number
  >(null);
  const receiveConnectStatusChange = useCallback(
    (payload: DeviceConnectStatusPayload) => {
      setBleDeviceConnectionStatus(payload);
      if (
        prevBleDeviceConnectionStatus.current?.status !== 'CONNECTED' &&
        payload.status === 'CONNECTED'
      ) {
        setBleDeviceBatteryLevel(null);
      }
    },
    [],
  );
  useEffect(() => {
    const subscription = RFIDWithUHFBLEModule.addDeviceConnectStatusListener(
      receiveConnectStatusChange,
    );
    return () => {
      subscription.remove();
    };
  }, [receiveConnectStatusChange]);

  // Automatically connect device
  useEffect(() => {
    if (!sheetOpened || useBuiltinReader) return;
    if (bleDeviceConnectionStatus?.status === 'CONNECTED') return;

    const tryToConnect = () => {
      if (!pairedBleDeviceAddress) {
        setShowReaderControls(true);
      } else {
        RFIDWithUHFBLEModule.connectDevice(pairedBleDeviceAddress);
      }
    };
    const timer = setTimeout(tryToConnect, 300);
    const interval = setInterval(tryToConnect, 5000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [
    pairedBleDeviceAddress,
    useBuiltinReader,
    bleDeviceConnectionStatus?.status,
    sheetOpened,
  ]);

  useEffect(() => {
    if (!sheetOpened || useBuiltinReader) return;
    if (bleDeviceConnectionStatus?.status !== 'CONNECTED') return;
    if (isWorking) return;

    const timer = setTimeout(() => {
      RFIDWithUHFBLEModule.getDeviceBatteryLevel().then(v =>
        setBleDeviceBatteryLevel(v),
      );
    }, 800);

    const interval = setInterval(() => {
      RFIDWithUHFBLEModule.getDeviceBatteryLevel().then(v =>
        setBleDeviceBatteryLevel(v),
      );
    }, 10000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [
    useBuiltinReader,
    bleDeviceConnectionStatus?.status,
    sheetOpened,
    isWorking,
  ]);

  // General

  const rfidReaderDeviceReady = (() => {
    if (useBuiltinReader) {
      return builtinReaderPowerOn;
    }

    return bleDeviceConnectionStatus?.status === 'CONNECTED';
  })();

  const RFIDModule = useMemo(() => {
    if (useBuiltinReader) return RFIDWithUHFUARTModule;
    return RFIDWithUHFBLEModule;
  }, [useBuiltinReader]);
  // #endregion //

  // #region Configs from DB //
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
  // #endregion //

  // #region Functionalities //

  const [power, setPower] = useState(20);

  useEffect(() => {
    switch (options?.functionality) {
      case 'scan':
        return setPower(useBuiltinReader ? 28 : 20);
      case 'locate':
        return setPower(28);
      case 'write':
      default:
        return setPower(8);
    }
  }, [options?.functionality, useBuiltinReader]);

  const [scanStatus, setScanStatus] = useState('');
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
      setIsWorking(true);
      setScanStatus('Scan starting...');
      await RFIDModule.startScan({
        power,
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
      setScanStatus('Scanning...');
    } catch (e: any) {
      setScanStatus(`Error: ${e?.message}`);
      setIsWorking(false);
    }
  }, [RFIDModule, defaultFilter, power, receiveScanData]);

  const stopScan = useCallback(async () => {
    try {
      setScanStatus('Stopping...');
      await RFIDModule.stopScan();
      setScanStatus('');
      setIsWorking(false);
    } catch (e: any) {
      setScanStatus(`Error: ${e?.message}`);
    }
  }, [RFIDModule]);

  const clearScannedData = useCallback(async () => {
    setScannedData({});
    setScannedDataCount(0);
    await RFIDModule.clearScannedTags();
  }, [RFIDModule]);

  const [locateReaderSoundEnabled, setLocateReaderSoundEnabled] =
    useState(true);
  const [locateStatus, setLocateStatus] = useState('');
  const [locateRssi, setLocateRssi] = useState<number | null>(null);

  const clearLocateRssiTimer = useRef<NodeJS.Timeout | null>(null);
  const receiveLocateData = useCallback(
    (d: ScanData[]) => {
      if (options?.functionality !== 'locate') return;

      const filteredD = d.filter(({ epc }) => epc === options?.epc);
      const lastD = filteredD[filteredD.length - 1];
      if (!lastD) return;

      if (clearLocateRssiTimer.current)
        clearTimeout(clearLocateRssiTimer.current);
      setLocateRssi(lastD.rssi);
      clearLocateRssiTimer.current = setTimeout(() => {
        setLocateRssi(null);
      }, 1000);
    },
    [options],
  );

  const startLocate = useCallback(async () => {
    if (options?.functionality !== 'locate') return;
    try {
      setIsWorking(true);
      setLocateStatus('Starting...');
      await RFIDModule.startScan({
        power,
        soundEnabled: true,
        callback: receiveLocateData,
        scanRate: 30,
        eventRate: 250,
        filter: {
          memoryBank: 'EPC',
          bitOffset: 32,
          bitCount: (options?.epc.length || 0) * 4,
          data: options?.epc,
        },
        isLocate: true,
        enableReaderSound: locateReaderSoundEnabled,
      });
      setLocateStatus('Locating...');
    } catch (e: any) {
      setLocateStatus(`Error: ${e?.message}`);
      setIsWorking(false);
    }
  }, [RFIDModule, locateReaderSoundEnabled, options, power, receiveLocateData]);

  const stopLocate = useCallback(async () => {
    try {
      setLocateStatus('Stopping...');
      await RFIDModule.stopScan();
      setLocateStatus('');
      setIsWorking(false);
    } catch (e: any) {
      setLocateStatus(`Error: ${e?.message}`);
    }
  }, [RFIDModule]);

  const clearWriteAndLockStatusTimer = useRef<NodeJS.Timeout | null>(null);
  const [writeAndLockStatus, setWriteAndLockStatus] = useState('');
  const writeAndLock = useCallback(async () => {
    if (options?.functionality !== 'write') return;
    if (isWorking) return;
    if (!config) return;

    const accessPassword = getTagAccessPassword(
      config.rfidTagAccessPassword,
      options.tagAccessPassword || '00000000',
      config.rfidTagAccessPasswordEncoding,
    );

    try {
      if (clearWriteAndLockStatusTimer.current)
        clearTimeout(clearWriteAndLockStatusTimer.current);
      setIsWorking(true);
      await RFIDModule.writeEpcAndLock(options.epc, accessPassword, {
        power,
        oldAccessPassword: '00000000',
        soundEnabled: true,
        reportStatus: setWriteAndLockStatus,
      });
    } catch (e: any) {
      // console.warn(e);
    } finally {
      setIsWorking(false);
      clearWriteAndLockStatusTimer.current = setTimeout(
        () => setWriteAndLockStatus(''),
        3000,
      );
    }
  }, [options, isWorking, config, RFIDModule, power]);

  const unlockAndReset = useCallback(async () => {
    if (options?.functionality !== 'write') return;
    if (isWorking) return;
    if (!config) return;

    const accessPassword = getTagAccessPassword(
      config.rfidTagAccessPassword,
      options.tagAccessPassword || '00000000',
      config.rfidTagAccessPasswordEncoding,
    );

    try {
      if (clearWriteAndLockStatusTimer.current)
        clearTimeout(clearWriteAndLockStatusTimer.current);
      setIsWorking(true);
      await RFIDModule.resetEpcAndUnlock(accessPassword, {
        power,
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
      setIsWorking(false);
      clearWriteAndLockStatusTimer.current = setTimeout(
        () => setWriteAndLockStatus(''),
        3000,
      );
    }
  }, [options, config, RFIDModule, power, isWorking]);

  const [dCounter, setDCounter] = useState(1);
  // #endregion //

  // #region Shared Event Handlers //
  const [actionButtonPressedIn, setActionButtonPressedIn] = useState(false);
  const handleActionButtonPress = useCallback(() => {
    switch (options?.functionality) {
      case 'scan': {
        return;
      }
      case 'write': {
        return;
      }
      case 'locate': {
        return;
      }
      default:
        setDCounter(v => (v >= 4 ? 1 : v + 1));
    }
  }, [options?.functionality]);
  const handleActionButtonPressIn = useCallback(() => {
    setActionButtonPressedIn(true);
    switch (options?.functionality) {
      case 'scan': {
        return startScan();
      }
      case 'locate': {
        return startLocate();
      }
      case 'write': {
        return writeAndLock();
      }
    }
  }, [options?.functionality, startLocate, startScan, writeAndLock]);
  const handleActionButtonPressOut = useCallback(() => {
    setActionButtonPressedIn(false);
    switch (options?.functionality) {
      case 'scan': {
        return stopScan();
      }
      case 'locate': {
        return stopLocate();
      }
    }
  }, [options?.functionality, stopLocate, stopScan]);
  // #endregion //

  // #region Render //
  const [showReaderControls, setShowReaderControls] = useState(false);
  const [showReaderSetup, setShowReaderSetup] = useState(false);
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

          case 'locate':
            return 'Start';

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
            <View style={styles.actionButtonAndStatusTextContainer}>
              <Text style={styles.actionButtonStatusText} numberOfLines={1}>
                {(() => {
                  switch (options?.functionality) {
                    case 'scan':
                      return scanStatus;
                    case 'locate':
                      return locateStatus;
                    case 'write':
                      return writeAndLockStatus;
                  }
                })() || '  '}
              </Text>
              <ElevatedButton
                title={buttonLabel}
                color={buttonColor}
                pressRetentionOffset={ACTION_BUTTON_PRESS_RETENTION_OFFSET}
                onPress={handleActionButtonPress}
                onPressIn={handleActionButtonPressIn}
                onPressOut={handleActionButtonPressOut}
                down={(() => {
                  switch (options?.functionality) {
                    case 'write':
                      return isWorking;
                    default:
                      return false;
                  }
                })()}
                disabled={(() => {
                  if (!rfidReaderDeviceReady) return true;

                  switch (options?.functionality) {
                    default:
                      return false;
                  }
                })()}
                loading={(() => {
                  switch (options?.functionality) {
                    case 'write':
                      return isWorking;
                    default:
                      return false;
                  }
                })()}
              />
            </View>
            <View
              style={[
                styles.moreControlsContainer,
                { paddingTop: safeAreaInsets.bottom / 2 },
              ]}
            >
              <View style={styles.secondaryButtonContainer}>
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
              <View style={styles.readerDeviceContainer}>
                <TouchableOpacity onPress={() => setShowReaderControls(true)}>
                  <View style={styles.readerDeviceNameContainer}>
                    <ReaderIcon
                      size={20}
                      loading={!rfidReaderDeviceReady}
                      isBluetooth={!useBuiltinReader}
                    />
                    <Text style={styles.readerDeviceNameText}>
                      {' '}
                      {(() => {
                        if (useBuiltinReader) return 'Built-In UHF';
                        return pairedBleDeviceName || 'Not Configured';
                      })()}
                    </Text>
                  </View>
                  <View style={styles.readerStatusContainer}>
                    {!useBuiltinReader &&
                      rfidReaderDeviceReady &&
                      bleDeviceBatteryLevel !== null && (
                        <>
                          <BatteryIcon
                            percentage={bleDeviceBatteryLevel}
                            size={18}
                          />
                          <Text style={styles.readerStatusText}>
                            {' '}
                            {bleDeviceBatteryLevel}%{'  '}
                          </Text>
                        </>
                      )}
                    <DbmPowerIcon size={18} />
                    <Text style={styles.readerStatusText}>
                      {' '}
                      {power}
                      <Text style={commonStyles.fs8}> </Text>
                      dBm
                      {/* */}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
              <View style={styles.secondaryButtonContainer}>
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
      footerBottomInset,
      contentBottomInset,
      sheetBackgroundColor,
      handleActionButtonPress,
      handleActionButtonPressIn,
      handleActionButtonPressOut,
      safeAreaInsets.bottom,
      rfidReaderDeviceReady,
      useBuiltinReader,
      bleDeviceBatteryLevel,
      power,
      options?.functionality,
      red2,
      yellow2,
      scanStatus,
      locateStatus,
      writeAndLockStatus,
      isWorking,
      clearScannedData,
      unlockAndReset,
      pairedBleDeviceName,
      innerRef,
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
    <>
      <BottomSheetModal
        ref={innerRef}
        enableContentPanningGesture={!actionButtonPressedIn}
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
                        <Text
                          style={[commonStyles.opacity05, commonStyles.tac]}
                        >
                          Press and hold the Scan button to start scanning
                        </Text>
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
            case 'write': {
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
                    <InsetGroup
                      // label="Write Data"
                      footerLabel={
                        'Hold the RFID tag near the reader and press "Write" to write and lock it. To reset and unlock a written tag, press "Wipe".'
                      }
                      style={{
                        backgroundColor: insetGroupBackgroundColor,
                      }}
                    >
                      <TouchableWithoutFeedback
                        onPress={() => setDevShowDetailsCounter(v => v + 1)}
                      >
                        <InsetGroup.Item
                          vertical2
                          label="EPC"
                          detailAsText
                          detail={
                            <AutoSizeText
                              fontSize={InsetGroup.FONT_SIZE}
                              mode={ResizeTextMode.max_lines}
                              numberOfLines={1}
                            >
                              {(() => {
                                try {
                                  const [epc] = EPCUtils.decodeHexEPC(
                                    options.epc,
                                  );
                                  return epc;
                                } catch (e) {
                                  return options.epc;
                                }
                              })()}
                            </AutoSizeText>
                          }
                        />
                      </TouchableWithoutFeedback>
                      {devShowDetailsCounter > 10 && (
                        <>
                          <InsetGroup.ItemSeperator />
                          <InsetGroup.Item
                            vertical2
                            label="Raw EPC"
                            detail={options.epc}
                          />
                          <InsetGroup.ItemSeperator />
                          <InsetGroup.Item
                            vertical2
                            label="Access Password"
                            detail={
                              config
                                ? getTagAccessPassword(
                                    config.rfidTagAccessPassword,
                                    options.tagAccessPassword || '00000000',
                                    config.rfidTagAccessPasswordEncoding,
                                  )
                                : 'Config Not Ready'
                            }
                          />
                        </>
                      )}
                    </InsetGroup>
                  </View>
                </BottomSheetScrollView>
              );
            }
            case 'locate': {
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
                    <InsetGroup
                      // label="Write Data"
                      footerLabel={
                        'Press and hold the "Start" button, move the RFID reader slowly and observe the change of RSSI to locate a tag.'
                      }
                      style={{
                        backgroundColor: insetGroupBackgroundColor,
                      }}
                    >
                      <InsetGroup.Item
                        vertical2
                        label="EPC"
                        detailAsText
                        detail={
                          <AutoSizeText
                            fontSize={InsetGroup.FONT_SIZE}
                            mode={ResizeTextMode.max_lines}
                            numberOfLines={1}
                          >
                            {(() => {
                              try {
                                const [epc] = EPCUtils.decodeHexEPC(
                                  options.epc,
                                );
                                return epc;
                              } catch (e) {
                                return options.epc;
                              }
                            })()}
                          </AutoSizeText>
                        }
                      />
                      <InsetGroup.ItemSeperator />
                      <InsetGroup.Item
                        vertical2
                        label="RSSI"
                        detailAsText
                        detail={
                          <Text
                            style={
                              locateRssi === null && commonStyles.opacity02
                            }
                          >
                            {locateRssi || 'No Signal'}
                          </Text>
                        }
                      />
                      {!useBuiltinReader && (
                        <>
                          <InsetGroup.ItemSeperator />
                          <InsetGroup.Item
                            label="Enable Reader Beep"
                            detail={
                              <Switch
                                value={locateReaderSoundEnabled}
                                onChange={() =>
                                  setLocateReaderSoundEnabled(v => !v)
                                }
                              />
                            }
                          />
                        </>
                      )}
                    </InsetGroup>
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
                          detail={rfidReaderDeviceReady ? 'Ready' : 'Not Ready'}
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
                            // if (options?.functionality === 'write') {
                            //   return writeAndLockStatus;
                            // }
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

      <Modal
        isVisible={showReaderControls}
        onBackdropPress={() => setShowReaderControls(false)}
      >
        {(() => {
          if (showReaderSetup) {
            return (
              <ScrollView
                style={[
                  styles.controlsModelContent,
                  {
                    backgroundColor: sheetBackgroundColor,
                    maxHeight:
                      (windowDimensions.height -
                        safeAreaInsets.top -
                        safeAreaInsets.bottom) *
                      0.8,
                  },
                ]}
              >
                <InsetGroup
                  style={[
                    commonStyles.mt32,
                    {
                      backgroundColor: insetGroupBackgroundColor,
                    },
                  ]}
                >
                  <InsetGroup.Item
                    button
                    label="Back"
                    onPress={() => setShowReaderSetup(false)}
                  />
                </InsetGroup>
                {pairedBleDeviceAddress && (
                  <InsetGroup
                    label="Paired Device"
                    style={{ backgroundColor: insetGroupBackgroundColor }}
                  >
                    <InsetGroup.Item
                      label="Name"
                      detail={pairedBleDeviceName}
                    />
                    <InsetGroup.ItemSeperator />
                    <InsetGroup.Item
                      label="ID"
                      detail={pairedBleDeviceAddress}
                    />
                  </InsetGroup>
                )}

                <InsetGroup
                  label="Connect to New Device"
                  style={{ backgroundColor: insetGroupBackgroundColor }}
                >
                  <InsetGroup.Item
                    button
                    label="Search"
                    onPress={scanBleDevices}
                  />
                  <InsetGroup.ItemSeperator />
                  {Object.values(scanBleDevicesData).length <= 0 && (
                    <InsetGroup.Item
                      disabled
                      label={'Press "Search" to search devices'}
                    />
                  )}
                  {/*{Object.values(scanBleDevicesData).length > 0 && (
                    <>
                      <InsetGroup.Item
                        button
                        label="Clear List"
                        onPress={clearScanDevicesData}
                      />
                      <InsetGroup.ItemSeperator />
                    </>
                  )}*/}
                  {Object.values(scanBleDevicesData)
                    .flatMap(d => [
                      <InsetGroup.Item
                        key={d.address}
                        label={d.name || d.address}
                        vertical
                        detail={[d.address, d.rssi && `RSSI: ${d.rssi}`]
                          .filter(s => s)
                          .join(', ')}
                        onPress={() => pairDevice(d)}
                      />,
                      <InsetGroup.ItemSeperator key={`s-${d.address}`} />,
                    ])
                    .slice(0, -1)}
                </InsetGroup>
              </ScrollView>
            );
          }

          return (
            <View
              style={[
                styles.controlsModelContent,
                { backgroundColor: sheetBackgroundColor },
              ]}
            >
              <InsetGroup
                label="Device"
                labelContainerStyle={commonStyles.mt32}
                style={{
                  backgroundColor: insetGroupBackgroundColor,
                }}
              >
                <InsetGroup.Item
                  label="Use Built-In UHF"
                  detail={
                    <Switch
                      value={useBuiltinReader}
                      onChange={() => setUseBuiltinReader(v => !v)}
                    />
                  }
                />
                {(() => {
                  if (useBuiltinReader) {
                    return (
                      <>
                        <InsetGroup.ItemSeperator />
                        <InsetGroup.Item
                          label="Status"
                          detail={builtinReaderPowerOn ? 'On' : 'Off'}
                        />
                      </>
                    );
                  }

                  return (
                    <>
                      {pairedBleDeviceAddress && (
                        <>
                          <InsetGroup.ItemSeperator />
                          <InsetGroup.Item
                            label="Device Name"
                            detail={pairedBleDeviceName}
                          />
                          <InsetGroup.ItemSeperator />
                          <InsetGroup.Item
                            label="Device ID"
                            detail={pairedBleDeviceAddress}
                          />
                        </>
                      )}
                      <InsetGroup.ItemSeperator />
                      <InsetGroup.Item
                        label="Status"
                        detail={(() => {
                          if (!pairedBleDeviceAddress) return 'Not Configured';
                          if (bleDeviceConnectionStatus?.status === 'CONNECTED')
                            return 'Connected';
                          if (
                            bleDeviceConnectionStatus?.status === 'CONNECTING'
                          )
                            return 'Connecting';
                          return 'Not Connected';
                        })()}
                      />
                      <InsetGroup.ItemSeperator />
                      <InsetGroup.Item
                        button
                        label="Setup"
                        onPress={() => {
                          setShowReaderSetup(true);
                        }}
                      />
                    </>
                  );
                })()}
              </InsetGroup>
              {useBuiltinReader && (
                <InsetGroup
                  label="Auto Free"
                  footerLabel="If enabled, the built-in RFID module will automatically power off while not being used."
                  style={{ backgroundColor: insetGroupBackgroundColor }}
                >
                  <InsetGroup.Item
                    label="Enabled"
                    detail={
                      <Switch
                        value={builtinReaderAutoFree}
                        onChange={() => setBuiltinReaderAutoFree(v => !v)}
                      />
                    }
                  />
                  <InsetGroup.ItemSeperator />
                  <InsetGroup.Item
                    label="Timeout"
                    detail={`${builtinReaderAutoFreeTimeout}s`}
                  >
                    <Slider
                      style={[commonStyles.flex1]}
                      minimumValue={3}
                      maximumValue={300}
                      step={1}
                      value={builtinReaderAutoFreeTimeout}
                      onValueChange={v => setBuiltinReaderAutoFreeTimeout(v)}
                    />
                  </InsetGroup.Item>
                </InsetGroup>
              )}
              <InsetGroup
                label="Power"
                style={[
                  commonStyles.row,
                  commonStyles.centerChildren,
                  commonStyles.p8,
                  commonStyles.ph16,
                  {
                    backgroundColor: insetGroupBackgroundColor,
                  },
                ]}
              >
                <Slider
                  style={commonStyles.flex1}
                  minimumValue={5}
                  maximumValue={30}
                  step={1}
                  value={power}
                  onValueChange={v => setPower(v)}
                />
                <Text
                  style={{
                    color: contentSecondaryTextColor,
                    fontSize: InsetGroup.FONT_SIZE,
                  }}
                >
                  {'  '}
                  {power} dBm
                </Text>
              </InsetGroup>
            </View>
          );
        })()}
      </Modal>
    </>
  );
  // #endregion //
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

function ReaderIcon({
  color,
  size,
  opacity,
  isBluetooth,
  loading,
}: {
  color?: string;
  size?: number;
  opacity?: number;
  isBluetooth?: boolean;
  loading?: boolean;
}) {
  const { contentTextColor } = useColors();
  const c = color || contentTextColor;

  if (loading) {
    return <ActivityIndicator color={c} size={size} />;
  }

  return (
    <Icon
      name={isBluetooth ? 'bluetooth' : 'cellphone-wireless'}
      size={size || 16}
      color={c}
      style={{ opacity: opacity || 0.9 }}
    />
  );
}

function BatteryIcon({
  color,
  size,
  opacity,
  percentage,
}: {
  color?: string;
  size?: number;
  opacity?: number;
  percentage?: number;
}) {
  const { contentTextColor } = useColors();
  const c = color || contentTextColor;
  const p = percentage ? Math.ceil(percentage / 10.0 - 0.5) : -10;
  let iconName = 'battery';
  if (p > -10 && p < 10) {
    if (p < 1) {
      iconName = 'battery-10';
    } else {
      iconName = `battery-${p}0`;
    }
  }
  return (
    <Icon
      name={iconName}
      size={size || 16}
      color={c}
      style={{ opacity: opacity || 0.9, transform: [{ rotate: '-90deg' }] }}
    />
  );
}

function DbmPowerIcon({
  color,
  size,
  opacity,
}: {
  color?: string;
  size?: number;
  opacity?: number;
  percentage?: number;
}) {
  const { contentTextColor } = useColors();
  const c = color || contentTextColor;

  return (
    <Icon
      name="access-point"
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
  actionButtonAndStatusTextContainer: {
    alignItems: 'stretch',
  },
  actionButtonStatusText: {
    marginBottom: 8,
    marginTop: -8,
    opacity: 0.4,
    paddingHorizontal: 16,
    textAlign: 'center',
    fontSize: 12.8,
  },
  powerSliderContainer: {
    alignItems: 'center',
  },
  moreControlsContainer: {
    marginHorizontal: -4,
    height: 100,
    flexDirection: 'row',
  },
  secondaryButtonContainer: { width: 100, justifyContent: 'center' },
  readerDeviceContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  readerDeviceNameContainer: {
    opacity: 0.3,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  readerDeviceNameText: { fontSize: 14, fontWeight: '500' },
  readerStatusContainer: {
    opacity: 0.2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  readerStatusText: { fontSize: 12, fontWeight: '400' },
  controlsModelContent: {
    borderRadius: 8,
  },
});

export default React.forwardRef(RFIDSheet);
