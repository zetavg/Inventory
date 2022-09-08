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
    self->searchForConnectToIdentifier = identifier;
    
    // We use [[NSRunLoop mainRunLoop] addTimer:forMode:]; instead
    //    dispatch_async(dispatch_get_main_queue(), ^{
    //    });
    [[RFIDBlutoothManager shareManager] startBleScan];
//    if (![RFIDBlutoothManager shareManager].connectDevice) {
//      // Just to poke centralManager so that it can report status correctly
//      [[RFIDBlutoothManager shareManager].centralManager scanForPeripheralsWithServices:nil options:@{CBCentralManagerScanOptionAllowDuplicatesKey : @ YES}];
//      [[RFIDBlutoothManager shareManager].centralManager stopScan];
//    }
//    BOOL result = [[RFIDBlutoothManager shareManager] connectPeripheralWithIdentifier:identifier];
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
                  (BOOL)soundEnabled:
                  (RCTPromiseResolveBlock)resolve:
                  (RCTPromiseRejectBlock)reject)
{
  @try {
    self->scanTagsEventRate = eventRate;
    self->lastScanTagsEventEmittedAt = CACurrentMediaTime() * 1000;
    
    [[RFIDBlutoothManager shareManager] setFatScaleBluetoothDelegate:self];
    [[RFIDBlutoothManager shareManager] setLaunchPowerWithstatus:@"1" antenna:@"1" readStr:[power stringValue] writeStr:[power stringValue]];
    if (enableFilter) {
      [[RFIDBlutoothManager shareManager] setFilterWithBank:[memoryBank intValue] ptr:[filterBitOffset intValue] cnt:[filterBitCount intValue] data:filterData];
    } else {
      [[RFIDBlutoothManager shareManager] setFilterWithBank:1 ptr:32 cnt:0 data:@"00"];
    }
    
    [RFIDBlutoothManager shareManager].isSupportRssi = YES;
    usleep(300 * 1000);

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
    NSTimer *endStopScanTimer = [NSTimer timerWithTimeInterval:0.5 target:self selector:@selector(endStopScan:) userInfo:@{@"resolve": resolve} repeats:NO];
    [[NSRunLoop mainRunLoop] addTimer:endStopScanTimer forMode:NSRunLoopCommonModes];
  } @catch (NSException *exception) {
    reject(exception.name, exception.reason, nil);
  }
}

- (void) endStopScan:(NSTimer *)timer
{
  if (!self->scanTagsData) return;

  [self sendEventWithName:@"uhfScanData" body:self->scanTagsData];
  [self->scanTagsData removeAllObjects];
  
  RCTPromiseResolveBlock resolve = [[timer userInfo] objectForKey:@"resolve"];
  resolve(@(true));
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

- (void)receiveScannedEpcWithRssi:(NSString *)epc withRssi:(double)rssi
{
  NSLog(@"receiveScannedEpcWithRssi %f - %@", rssi, epc);
  NSMutableDictionary *jsData = [NSMutableDictionary dictionary];
  [jsData setObject:epc forKey: @"epc"];
  [jsData setObject:@(rssi) forKey: @"rssi"];
  
  if (!self->scanTagsData) self->scanTagsData = [NSMutableArray array];
  [self->scanTagsData addObject:jsData];

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
  }
}

@synthesize description;

@end
