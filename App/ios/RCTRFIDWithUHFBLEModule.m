#import <AudioToolbox/AudioToolbox.h>

#import "RCTRFIDWithUHFBLEModule.h"

#import "RFIDBlutoothManager.h"
#import "BLEModel.h"

@implementation RCTRFIDWithUHFBLEModule

// To export a module named RFIDWithUHFBLEModule
RCT_EXPORT_MODULE(RFIDWithUHFBLEModule);

- (NSArray<NSString *> *)supportedEvents
{
  return @[
    @"uhfDevicesScanData",
    @"uhfDeviceConnectionStatus",
    @"uhfScanData",
    @"uhfLocateValue"
  ];
}

#pragma mark - Init

RCT_EXPORT_METHOD(init:
                  (RCTPromiseResolveBlock)resolve:
                  (RCTPromiseRejectBlock)reject)
{
  @try {
    [[RFIDBlutoothManager shareManager] setFatScaleBluetoothDelegate:self];
    resolve(@(YES));
  } @catch (NSException *exception) {
    reject(exception.name, exception.reason, nil);
  }
}

RCT_EXPORT_METHOD(free:
                  (RCTPromiseResolveBlock)resolve:
                  (RCTPromiseRejectBlock)reject)
{
  @try {
    [[RFIDBlutoothManager shareManager] setFatScaleBluetoothDelegate:self];
    [[RFIDBlutoothManager shareManager] closeBleAndDisconnect];
    resolve(@(YES));
  } @catch (NSException *exception) {
    reject(exception.name, exception.reason, nil);
  }
}

#pragma mark - BLE Scan & Connect

RCT_EXPORT_METHOD(scanDevices:
                  (BOOL)enable:
                  (double)eventRate:
                  (RCTPromiseResolveBlock)resolve:
                  (RCTPromiseRejectBlock)reject)
{
  @try {
    [[RFIDBlutoothManager shareManager] setFatScaleBluetoothDelegate:self];

    if (!enable) {
      [[RFIDBlutoothManager shareManager] stopBleScan];
      NSLog(@"RCTRFIDWithUHFBLEModule: stopBleScan called on RFIDBlutoothManager");
      resolve(@(YES));
      return;
    }

    self->searchForConnectToIdentifier = nil;
    self->scanDevicesEventRate = eventRate;
    self->lastScanDevicesEventEmittedAt = CACurrentMediaTime() * 1000;
    // We use [[NSRunLoop mainRunLoop] addTimer:forMode:]; instead
    //    dispatch_async(dispatch_get_main_queue(), ^{
    //    });
    [[RFIDBlutoothManager shareManager] startBleScan];
    NSLog(@"RCTRFIDWithUHFBLEModule: startBleScan called on RFIDBlutoothManager");
    resolve(@(YES));
  } @catch (NSException *exception) {
    reject(exception.name, exception.reason, nil);
  }
}

RCT_EXPORT_METHOD(connectDevice:
                  (NSString *)identifier:
                  (RCTPromiseResolveBlock)resolve:
                  (RCTPromiseRejectBlock)reject)
{
  @try {
    [[RFIDBlutoothManager shareManager] setFatScaleBluetoothDelegate:self];

    // Try to connect a paired device
    BOOL result = [[RFIDBlutoothManager shareManager] connectPeripheralWithIdentifier:identifier];
    if (result == YES) {
      resolve(@(true));
      return;
    }
    
    // Or try to search and connect to a unpaired device
    self->searchForConnectToIdentifier = identifier;
    [[RFIDBlutoothManager shareManager] startBleScan];
    [[RFIDBlutoothManager shareManager] initSoundIfNeeded];
    resolve(@(true));
  } @catch (NSException *exception) {
    reject(exception.name, exception.reason, nil);
  }
}

RCT_EXPORT_METHOD(disconnectDevice:
                  (RCTPromiseResolveBlock)resolve:
                  (RCTPromiseRejectBlock)reject)
{
  @try {
    [[RFIDBlutoothManager shareManager] setFatScaleBluetoothDelegate:self];

    // We use [[NSRunLoop mainRunLoop] addTimer:forMode:]; instead
    //    dispatch_async(dispatch_get_main_queue(), ^{
    //    });
    [[RFIDBlutoothManager shareManager] closeBleAndDisconnect];
    resolve(@(YES));
  } @catch (NSException *exception) {
    reject(exception.name, exception.reason, nil);
  }
}

#pragma mark - Device Status

RCT_EXPORT_METHOD(getDeviceConnectStatus:
                  (RCTPromiseResolveBlock)resolve:
                  (RCTPromiseRejectBlock)reject)
{
  @try {
    BOOL result = [RFIDBlutoothManager shareManager].connectDevice;
    if (result) resolve(@"CONNECTED");
    else resolve(@"DISCONNECTED");
  } @catch (NSException *exception) {
    reject(exception.name, exception.reason, nil);
  }
}

RCT_EXPORT_METHOD(getDeviceBatteryLevel:
                  (RCTPromiseResolveBlock)resolve:
                  (RCTPromiseRejectBlock)reject)
{
  @try {
    [[RFIDBlutoothManager shareManager] setFatScaleBluetoothDelegate:self];
    if (![RFIDBlutoothManager shareManager].connectDevice) {
      resolve(@{@"value":@(-1)});
    }
    if (!getDeviceBatteryLevelResolveFns) getDeviceBatteryLevelResolveFns = [NSMutableArray array];
    [getDeviceBatteryLevelResolveFns addObject:resolve];
    [[RFIDBlutoothManager shareManager] getBatteryLevel];
  } @catch (NSException *exception) {
    reject(exception.name, exception.reason, nil);
  }
}

RCT_EXPORT_METHOD(getDeviceTemperature:
                  (RCTPromiseResolveBlock)resolve:
                  (RCTPromiseRejectBlock)reject)
{
  @try {
    [[RFIDBlutoothManager shareManager] setFatScaleBluetoothDelegate:self];
    if (![RFIDBlutoothManager shareManager].connectDevice) {
      resolve(@{@"value":@(-1)});
    }
    if (!getDeviceTemperatureResolveFns) getDeviceTemperatureResolveFns = [NSMutableArray array];
    [getDeviceTemperatureResolveFns addObject:resolve];
    [[RFIDBlutoothManager shareManager] getServiceTemperature];
  } @catch (NSException *exception) {
    reject(exception.name, exception.reason, nil);
  }
}

#pragma mark - Scan Tags

RCT_EXPORT_METHOD(startScan:
                  (NSNumber*_Nonnull)power:
                  (BOOL)enableFilter:
                  (NSNumber*_Nonnull)memoryBank:
                  (NSNumber*_Nonnull)filterBitOffset:
                  (NSNumber*_Nonnull)filterBitCount:
                  (NSString*_Nonnull)filterData:
                  (double)scanRate:
                  (double)eventRate:
                  (BOOL)isLocate:
                  (BOOL)soundEnabled:
                  (BOOL)enableReaderSound:
                  (NSArray*)scannedEpcsArr:
                  (NSArray*)playSoundOnlyForEpcsArr:
                  (RCTPromiseResolveBlock)resolve:
                  (RCTPromiseRejectBlock)reject)
{
  @try {
    self->scanTagsEventRate = eventRate;
    self->lastScanTagsEventEmittedAt = CACurrentMediaTime() * 1000;

    [[RFIDBlutoothManager shareManager] setFatScaleBluetoothDelegate:self];
    [[RFIDBlutoothManager shareManager] setLaunchPowerWithstatus:@"1" antenna:@"1" readStr:[power stringValue] writeStr:[power stringValue]];
    usleep(80 * 1000);
    // Init or reset scanned epcs
    if (!scannedEpcs || scannedEpcsArr.count > 0) scannedEpcs = [[NSMutableSet alloc] init];
    if (scannedEpcsArr.count > 0) {
      for (NSString* epc in scannedEpcsArr) {
        [scannedEpcs addObject:[epc lowercaseString]];
      }
      // [scannedEpcs addObjectsFromArray:scannedEpcsArr];
    }
    if (!enableReaderSound) {
      [[RFIDBlutoothManager shareManager] setCloseBuzzer];
      usleep(80 * 1000);
    }
    playSoundOnlyForEpcs = [[NSMutableSet alloc] init];
    if (playSoundOnlyForEpcsArr.count > 0) {
      [playSoundOnlyForEpcs addObjectsFromArray:playSoundOnlyForEpcsArr];
    }
    self->scanIsLocate = isLocate;
    self->soundEnabled = soundEnabled;
    if (enableFilter) {
      [[RFIDBlutoothManager shareManager]
       setFilterWithBank:[memoryBank intValue]
       ptr:[filterBitOffset intValue]
       cnt:[filterBitCount intValue]
       data:[filterData lowercaseString] // must use lower case on iOS side
      ];
    } else {
      [[RFIDBlutoothManager shareManager] setFilterWithBank:1 ptr:32 cnt:0 data:@"00"];
    }

    [RFIDBlutoothManager shareManager].isSupportRssi = YES;
    usleep(120 * 1000);

    // We use [[NSRunLoop mainRunLoop] addTimer:forMode:]; instead
    //    dispatch_async(dispatch_get_main_queue(), ^{
    //    });
    [RFIDBlutoothManager shareManager].isgetLab=YES;
    [[RFIDBlutoothManager shareManager] continuitySaveLabelWithCount:@"10000"];
    resolve(@(true));
  } @catch (NSException *exception) {
    reject(exception.name, exception.reason, nil);
  }
}

RCT_EXPORT_METHOD(getLabMessage:
                  (RCTPromiseResolveBlock)resolve:
                  (RCTPromiseRejectBlock)reject)
{
  @try {
    [[RFIDBlutoothManager shareManager] getLabMessage];
    resolve(@(true));
  } @catch (NSException *exception) {
    reject(exception.name, exception.reason, nil);
  }
}

RCT_EXPORT_METHOD(stopScan:
                  (RCTPromiseResolveBlock)resolve:
                  (RCTPromiseRejectBlock)reject)
{
  @try {
    [[RFIDBlutoothManager shareManager] setFatScaleBluetoothDelegate:self];

    // We use [[NSRunLoop mainRunLoop] addTimer:forMode:]; instead
    //    dispatch_async(dispatch_get_main_queue(), ^{
    //    });
    [RFIDBlutoothManager shareManager].isgetLab=NO;
    [[RFIDBlutoothManager shareManager] stopContinuitySaveLabel];

    // Need to let the last coming data to emit
    NSTimer *endStopScanTimer = [NSTimer timerWithTimeInterval:0.2 target:self selector:@selector(endStopScan:) userInfo:@{@"resolve": resolve} repeats:NO];
    [[NSRunLoop mainRunLoop] addTimer:endStopScanTimer forMode:NSRunLoopCommonModes];
  } @catch (NSException *exception) {
    reject(exception.name, exception.reason, nil);
  }
}

- (void) endStopScan:(NSTimer *)timer
{
  [[RFIDBlutoothManager shareManager] setOpenBuzzer];

  if (self->scanTagsData) {
    [self sendEventWithName:@"uhfScanData" body:self->scanTagsData];
    [self->scanTagsData removeAllObjects];
  }

  RCTPromiseResolveBlock resolve = [[timer userInfo] objectForKey:@"resolve"];
  resolve(@(true));
}

RCT_EXPORT_METHOD(clearScannedTags:
                  (RCTPromiseResolveBlock)resolve:
                  (RCTPromiseRejectBlock)reject)
{
  @try {
    [self->scannedEpcs removeAllObjects];
    NSLog(@"removeAllObjects");
    resolve(@(true));
  } @catch (NSException *exception) {
    reject(exception.name, exception.reason, nil);
  }
}

#pragma mark - Operations

RCT_EXPORT_METHOD(read:
                  (NSNumber*_Nonnull)power:
                  (NSNumber*_Nonnull)memoryBank:
                  (NSNumber*_Nonnull)offset:
                  (NSNumber*_Nonnull)count:
                  (NSString*_Nonnull)accessPassword:
                  (BOOL)enableFilter:
                  (NSNumber*_Nonnull)filterMemoryBank:
                  (NSNumber*_Nonnull)filterBitOffset:
                  (NSNumber*_Nonnull)filterBitCount:
                  (NSString*_Nonnull)filterData:
                  (BOOL)soundEnabled:
                  (RCTPromiseResolveBlock)resolve:
                  (RCTPromiseRejectBlock)reject)
{
  @try {
    if (self->working) {
      [[RFIDBlutoothManager shareManager] playSound:3 withVolume:1];
      reject(@"busy", @"another operation is still in process", nil);
      return;
    }
    self->working = YES;
    [[RFIDBlutoothManager shareManager] setFatScaleBluetoothDelegate:self];
    [[RFIDBlutoothManager shareManager] setLaunchPowerWithstatus:@"1" antenna:@"1" readStr:[power stringValue] writeStr:[power stringValue]];
    [self initFnsArraysIfNeeded];
    usleep(80 * 1000);
    [readResolveFns addObject:resolve];
    [readRejectFns addObject:reject];
    isWaitingRead = YES;
    self->soundEnabled = soundEnabled;
    [[RFIDBlutoothManager shareManager]
     readLabelMessageWithPassword:accessPassword
     MMBstr:[filterMemoryBank stringValue]
     MSAstr:[filterBitOffset stringValue]
     MDLstr:[filterBitCount stringValue]
     MDdata:[filterData lowercaseString] // must use lower case on iOS side
     MBstr:[memoryBank stringValue]
     SAstr:[offset stringValue]
     DLstr:[count stringValue]
     isfilter:enableFilter
    ];
    [readTimeoutTimer invalidate];
    self->readTimeoutTimer = [NSTimer timerWithTimeInterval:1.1 target:self selector:@selector(readTimeout) userInfo:nil repeats:NO];
    [[NSRunLoop mainRunLoop] addTimer:self->readTimeoutTimer forMode:NSRunLoopCommonModes];
    NSLog(@"RCTRFIDWithUHFBLEModule: sent readLabelMessageWithPassword");
  } @catch (NSException *exception) {
    self->working = NO;
    [readResolveFns removeAllObjects];
    [readRejectFns removeAllObjects];
    reject(exception.name, exception.reason, nil);
  }
}

- (void)readTimeout
{
  if (!isWaitingRead) {
    NSLog(@"Not triggering timeout since !isWaitingRead");
    return;
  }
  isWaitingRead = NO;
  NSLog(@"RCTRFIDWithUHFBLEModule: Read timeout");
  if (readTimeoutTimer) [readTimeoutTimer invalidate];
  if (self->soundEnabled) [[RFIDBlutoothManager shareManager] playSound:3 withVolume:1];
  if (readRejectFns) {
    for (RCTPromiseRejectBlock reject in readRejectFns) {
      reject(@"timeout", @"operation timeout", nil);
    }
    [readRejectFns removeAllObjects];
  }
  if (readResolveFns) {
    [readResolveFns removeAllObjects];
  }
  self->working = NO;
}

RCT_EXPORT_METHOD(write:
                  (NSNumber*_Nonnull)power:
                  (NSNumber*_Nonnull)memoryBank:
                  (NSNumber*_Nonnull)offset:
                  (NSNumber*_Nonnull)count:
                  (NSString*_Nonnull)accessPassword:
                  (NSString*_Nonnull)data:
                  (BOOL)enableFilter:
                  (NSNumber*_Nonnull)filterMemoryBank:
                  (NSNumber*_Nonnull)filterBitOffset:
                  (NSNumber*_Nonnull)filterBitCount:
                  (NSString*_Nonnull)filterData:
                  (BOOL)soundEnabled:
                  (RCTPromiseResolveBlock)resolve:
                  (RCTPromiseRejectBlock)reject)
{
  @try {
    if (self->working) {
      [[RFIDBlutoothManager shareManager] playSound:3 withVolume:1];
      reject(@"busy", @"another operation is still in process", nil);
      return;
    }
    [[RFIDBlutoothManager shareManager] setFatScaleBluetoothDelegate:self];
    [[RFIDBlutoothManager shareManager] setLaunchPowerWithstatus:@"1" antenna:@"1" readStr:[power stringValue] writeStr:[power stringValue]];
    [self initFnsArraysIfNeeded];
    usleep(80 * 1000);
    [writeResolveFns addObject:resolve];
    [writeRejectFns addObject:reject];
    isWaitingWrite = YES;
    self->soundEnabled = soundEnabled;
    [[RFIDBlutoothManager shareManager]
     writeLabelMessageWithPassword:accessPassword
     MMBstr:[filterMemoryBank stringValue]
     MSAstr:[filterBitOffset stringValue]
     MDLstr:[filterBitCount stringValue]
     MDdata:[filterData lowercaseString] // must use lower case on iOS side
     MBstr:[memoryBank stringValue]
     SAstr:[offset stringValue]
     DLstr:[count stringValue]
     writeData:[data lowercaseString] // must use lower case on iOS side
     isfilter:enableFilter
    ];
    [writeTimeoutTimer invalidate];
    self->writeTimeoutTimer = [NSTimer timerWithTimeInterval:1.1 target:self selector:@selector(writeTimeout) userInfo:nil repeats:NO];
    [[NSRunLoop mainRunLoop] addTimer:self->writeTimeoutTimer forMode:NSRunLoopCommonModes];
    NSLog(@"RCTRFIDWithUHFBLEModule: sent writeLabelMessageWithPassword");
  } @catch (NSException *exception) {
    self->working = NO;
    [writeResolveFns removeAllObjects];
    [writeRejectFns removeAllObjects];
    reject(exception.name, exception.reason, nil);
  }
}

- (void)writeTimeout
{
  if (!isWaitingWrite) {
    NSLog(@"Not triggering timeout since !isWaitingWrite");
    return;
  }
  isWaitingWrite = NO;
  NSLog(@"RCTRFIDWithUHFBLEModule: Write timeout");
  if (writeTimeoutTimer) [writeTimeoutTimer invalidate];
  if (self->soundEnabled) [[RFIDBlutoothManager shareManager] playSound:3 withVolume:1];
  if (writeRejectFns) {
    for (RCTPromiseRejectBlock reject in writeRejectFns) {
      reject(@"timeout", @"operation timeout", nil);
    }
    [writeRejectFns removeAllObjects];
  }
  if (writeResolveFns) {
    [writeResolveFns removeAllObjects];
  }
  self->working = NO;
}

RCT_EXPORT_METHOD(lock:
                  (NSNumber*_Nonnull)power:
                  (NSString*_Nonnull)accessPassword:
                  (NSString*_Nonnull)code:
                  (BOOL)enableFilter:
                  (NSNumber*_Nonnull)filterMemoryBank:
                  (NSNumber*_Nonnull)filterBitOffset:
                  (NSNumber*_Nonnull)filterBitCount:
                  (NSString*_Nonnull)filterData:
                  (BOOL)soundEnabled:
                  (RCTPromiseResolveBlock)resolve:
                  (RCTPromiseRejectBlock)reject)
{
  @try {
    if (self->working) {
      [[RFIDBlutoothManager shareManager] playSound:3 withVolume:1];
      reject(@"busy", @"another operation is still in process", nil);
      return;
    }
    [[RFIDBlutoothManager shareManager] setFatScaleBluetoothDelegate:self];
    [[RFIDBlutoothManager shareManager] setLaunchPowerWithstatus:@"1" antenna:@"1" readStr:[power stringValue] writeStr:[power stringValue]];
    [self initFnsArraysIfNeeded];
    usleep(80 * 1000);
    [lockResolveFns addObject:resolve];
    [lockRejectFns addObject:reject];
    isWaitingLock = YES;
    self->soundEnabled = soundEnabled;
    [[RFIDBlutoothManager shareManager]
     lockLabelWithPassword:accessPassword
     MMBstr:[filterMemoryBank stringValue]
     MSAstr:[filterBitOffset stringValue]
     MDLstr:[filterBitCount stringValue]
     MDdata:[filterData lowercaseString] // must use lower case on iOS side
     ldStr:[code lowercaseString] // must use lower case on iOS side
     isfilter:enableFilter
    ];
    [lockTimeoutTimer invalidate];
    self->lockTimeoutTimer = [NSTimer timerWithTimeInterval:1.1 target:self selector:@selector(lockTimeout) userInfo:nil repeats:NO];
    [[NSRunLoop mainRunLoop] addTimer:self->lockTimeoutTimer forMode:NSRunLoopCommonModes];
    NSLog(@"RCTRFIDWithUHFBLEModule: sent lockLabelMessageWithPassword");
  } @catch (NSException *exception) {
    self->working = NO;
    [lockResolveFns removeAllObjects];
    [lockRejectFns removeAllObjects];
    reject(exception.name, exception.reason, nil);
  }
}

- (void)lockTimeout
{
  if (!isWaitingLock) {
    NSLog(@"Not triggering timeout since !isWaitingLock");
    return;
  }
  isWaitingLock = NO;
  NSLog(@"RCTRFIDWithUHFBLEModule: Lock timeout");
  if (lockTimeoutTimer) [lockTimeoutTimer invalidate];
  if (self->soundEnabled) [[RFIDBlutoothManager shareManager] playSound:3 withVolume:1];
  if (lockRejectFns) {
    for (RCTPromiseRejectBlock reject in lockRejectFns) {
      reject(@"timeout", @"operation timeout", nil);
    }
    [lockRejectFns removeAllObjects];
  }
  if (lockResolveFns) {
    [lockResolveFns removeAllObjects];
  }
  self->working = NO;
}

#pragma mark - Sound

RCT_EXPORT_METHOD(playSound:
                  (int)soundId:
                  (RCTPromiseResolveBlock)resolve:
                  (RCTPromiseRejectBlock)reject)
{
  @try {
    [[RFIDBlutoothManager shareManager] playSound:soundId withVolume:1];
    resolve(@(true));
  } @catch (NSException *exception) {
    reject(exception.name, exception.reason, nil);
  }
}

#pragma mark - Utils

- (void)initFnsArraysIfNeeded
{
  if (!readResolveFns) readResolveFns = [NSMutableArray array];
  if (!readRejectFns) readRejectFns = [NSMutableArray array];
  if (!writeResolveFns) writeResolveFns = [NSMutableArray array];
  if (!writeRejectFns) writeRejectFns = [NSMutableArray array];
  if (!lockResolveFns) lockResolveFns = [NSMutableArray array];
  if (!lockRejectFns) lockRejectFns = [NSMutableArray array];
}

#pragma mark - FatScaleBluetoothManager Delegates

- (void)receiveDataWithBLEmodel:(BLEModel *)model result:(NSString *)result {
  if (self->searchForConnectToIdentifier) {
    // This search is for connecting to a specific device
    if ([self->searchForConnectToIdentifier isEqualToString:[model.peripheral.identifier UUIDString]]) {
      [[RFIDBlutoothManager shareManager] stopBleScan];
      [[RFIDBlutoothManager shareManager] connectPeripheral:model.peripheral macAddress:model.addressStr];
    }
    return;
  }

  NSMutableDictionary *jsData = [NSMutableDictionary dictionary];
  [jsData setObject:model.addressStr forKey: @"address"];
  [jsData setObject:@([model.rssStr integerValue]) forKey: @"rssi"];
  if (model.nameStr) [jsData setObject:model.nameStr forKey: @"name"];

  if (!self->scanDevicesData) self->scanDevicesData = [NSMutableArray array];
  [self->scanDevicesData addObject:jsData];

  long currentTime = CACurrentMediaTime() * 1000;
  if (currentTime - self->lastScanDevicesEventEmittedAt > self->scanDevicesEventRate) {
    [self sendEventWithName:@"uhfDevicesScanData" body:self->scanDevicesData];
    [self->scanDevicesData removeAllObjects];
    self->lastScanDevicesEventEmittedAt = currentTime;
  }
}

- (void)connectPeripheralSuccess:(CBPeripheral *)peripheral
{
  NSMutableDictionary *jsData = [NSMutableDictionary dictionary];
  [jsData setObject:@"CONNECTED" forKey: @"status"];
  [jsData setObject:[peripheral.identifier UUIDString] forKey: @"deviceAddress"];
  NSLog(@"RCTRFIDWithUHFBLEModule: connectPeripheralSuccess: %@", peripheral.identifier);
  if (peripheral.name) [jsData setObject:peripheral.name forKey: @"deviceName"];
  [self sendEventWithName:@"uhfDeviceConnectionStatus" body:jsData];
}

- (void)disConnectPeripheral
{
  NSMutableDictionary *jsData = [NSMutableDictionary dictionary];
  [jsData setObject:@"DISCONNECTED" forKey: @"status"];
  [self sendEventWithName:@"uhfDeviceConnectionStatus" body:jsData];
}

- (void)connectBluetoothFailWithMessage:(NSString *)msg
{
  NSMutableDictionary *jsData = [NSMutableDictionary dictionary];
  [jsData setObject:@"DISCONNECTED" forKey: @"status"];
  [self sendEventWithName:@"uhfDeviceConnectionStatus" body:jsData];
}

- (void)receiveScannedEpcWithRssi:(NSString *)epc withRssi:(double)nRssi
{
//  NSLog(@"receiveScannedEpcWithRssi %f - %@", rssi, epc);
  double rssi = -nRssi;
  NSMutableDictionary *jsData = [NSMutableDictionary dictionary];
  [jsData setObject:[epc uppercaseString] forKey: @"epc"];
  [jsData setObject:@(rssi) forKey: @"rssi"];

  if (!self->scanTagsData) self->scanTagsData = [NSMutableArray array];
  [self->scanTagsData addObject:jsData];

  if (self->soundEnabled && ([playSoundOnlyForEpcs count] <= 0 || [playSoundOnlyForEpcs containsObject:[epc uppercaseString]])) {
    if (self->scanIsLocate) {
      float maxVolume = 10;
      [[RFIDBlutoothManager shareManager] playSound:2 withVolume:1 + MIN(maxVolume, MAX(0, (80 + rssi) * (maxVolume / (80 - 30))))];
    } else {
      if ([self->scannedEpcs containsObject:epc]) {
        [[RFIDBlutoothManager shareManager] playSound:2 withVolume:1];
      } else {
        [[RFIDBlutoothManager shareManager] playSound:1 withVolume:1];
      }
    }
  }
  if (!scanIsLocate) [self->scannedEpcs addObject:epc];

  long currentTime = CACurrentMediaTime() * 1000;
  if (currentTime - self->lastScanTagsEventEmittedAt > self->scanTagsEventRate) {
    [self sendEventWithName:@"uhfScanData" body:self->scanTagsData];
    [self->scanTagsData removeAllObjects];
    self->lastScanTagsEventEmittedAt = currentTime;
  }
}

- (void)receiveDataWithBLEDataSource:(NSMutableArray *)dataSource allCount:(NSInteger)allCount countArr:(NSMutableArray *)countArr dataSource1:(NSMutableArray *)dataSource1 countArr1:(NSMutableArray *)countArr1 dataSource2:(NSMutableArray *)dataSource2 countArr2:(NSMutableArray *)countArr2 {
//  NSLog(@"RCTRFIDWithUHFBLEModule: receiveDataWithBLEDataSource: %@, %ld, %@, %@, %@, %@, %@", dataSource, (long)allCount, countArr, dataSource1, countArr1, dataSource2, countArr2);
}

- (void)receiveMessageWithtype:(NSString *)typeStr dataStr:(NSString *)dataStr {
  NSLog(@"RCTRFIDWithUHFBLEModule: receiveMessageWithtype: %@, %@", typeStr, dataStr);
  if ([typeStr isEqualToString:@"e5"]) {
    // Device Battery Level
    if (getDeviceBatteryLevelResolveFns) {
      for (RCTPromiseResolveBlock resolve in getDeviceBatteryLevelResolveFns) {
        resolve(@{ @"value": @([dataStr intValue]) });
      }
      [getDeviceBatteryLevelResolveFns removeAllObjects];
    }
  } else if ([typeStr isEqualToString:@"35"]) {
    // Device Temperature
    if (getDeviceTemperatureResolveFns) {
      for (RCTPromiseResolveBlock resolve in getDeviceTemperatureResolveFns) {
        resolve(@{ @"value": @([dataStr intValue]) });
      }
      [getDeviceTemperatureResolveFns removeAllObjects];
    }
  } else if ([typeStr isEqualToString:@"85"]) {
    // Read Tag
    isWaitingRead = NO;
    NSLog(@"RCTRFIDWithUHFBLEModule: Read success");
    if (self->soundEnabled) [[RFIDBlutoothManager shareManager] playSound:1 withVolume:1];
    if (readTimeoutTimer) [readTimeoutTimer invalidate];
    if (readResolveFns) {
      for (RCTPromiseResolveBlock resolve in readResolveFns) {
        resolve(dataStr);
      }
      [readResolveFns removeAllObjects];
    }
    if (readRejectFns) {
      [readRejectFns removeAllObjects];
    }
    self->working = NO;
  } else if ([typeStr isEqualToString:@"87"]) {
    // Write Tag
    isWaitingWrite = NO;
    if ([dataStr isEqualToString:@"Successful tag writing"]) {
      NSLog(@"RCTRFIDWithUHFBLEModule: Write success");
      if (self->soundEnabled) [[RFIDBlutoothManager shareManager] playSound:1 withVolume:1];
      if (writeTimeoutTimer) [writeTimeoutTimer invalidate];
      if (writeResolveFns) {
        for (RCTPromiseResolveBlock resolve in writeResolveFns) {
          resolve(dataStr);
        }
        [writeResolveFns removeAllObjects];
      }
      if (writeRejectFns) {
        [writeRejectFns removeAllObjects];
      }
    } else {
      NSLog(@"RCTRFIDWithUHFBLEModule: Write failed");
      if (self->soundEnabled) [[RFIDBlutoothManager shareManager] playSound:3 withVolume:1];
      if (writeTimeoutTimer) [writeTimeoutTimer invalidate];
      if (writeResolveFns) {
        [writeResolveFns removeAllObjects];
      }
      if (writeRejectFns) {
        for (RCTPromiseRejectBlock reject in writeRejectFns) {
          reject(@"failed", @"failed to write tag", nil);
        }
        [writeRejectFns removeAllObjects];
      }
    }
    self->working = NO;
  } else if ([typeStr isEqualToString:@"89"]) {
    // Lock Tag
    isWaitingLock = NO;
    if ([dataStr isEqualToString:@"Lock label successful"]) {
      NSLog(@"RCTRFIDWithUHFBLEModule: Lock success");
      if (self->soundEnabled) [[RFIDBlutoothManager shareManager] playSound:1 withVolume:1];
      if (lockTimeoutTimer) [lockTimeoutTimer invalidate];
      if (lockResolveFns) {
        NSLog(@"res count %lu", (unsigned long)[lockRejectFns count]);
        for (RCTPromiseResolveBlock resolve in lockResolveFns) {
          NSLog(@"res...");
          resolve(dataStr);
        }
        [lockResolveFns removeAllObjects];
      }
      if (lockRejectFns) {
        [lockRejectFns removeAllObjects];
      }
    } else {
      NSLog(@"RCTRFIDWithUHFBLEModule: Lock failed");
      if (self->soundEnabled) [[RFIDBlutoothManager shareManager] playSound:3 withVolume:1];
      if (lockTimeoutTimer) [lockTimeoutTimer invalidate];
      if (lockResolveFns) {
        [lockResolveFns removeAllObjects];
      }
      if (lockRejectFns) {
        for (RCTPromiseRejectBlock reject in lockRejectFns) {
          reject(@"failed", @"failed to lock tag", nil);
        }
        [lockRejectFns removeAllObjects];
      }
    }
    self->working = NO;
  }
}

@synthesize description;

@end
