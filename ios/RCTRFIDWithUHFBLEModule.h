#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import "RFIDBlutoothManager.h"

@interface RCTRFIDWithUHFBLEModule : RCTEventEmitter <RCTBridgeModule, FatScaleBluetoothManager> {
  NSMutableArray *getDeviceBatteryLevelResolveFns;
  NSMutableArray *getDeviceTemperatureResolveFns;
  
  NSMutableArray *scanDevicesData;
  double scanDevicesEventRate;
  double lastScanDevicesEventEmittedAt;
  NSString *searchForConnectToIdentifier;
}

@property (nonatomic, strong) NSTimer *untilPowerOnTimer;

@end
