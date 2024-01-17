//
//  RFIDBlutoothManager.m
//  RFID_ios
//
//  Created by chainway on 2018/4/26.
//  Copyright © 2018年 chainway. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "RFIDBlutoothManager.h"
// #import "BSprogreUtil.h"
#import "AppHelper.h"


#define kFatscaleTimeOut 15.0

#define serviceUUID  @"6E400001-B5A3-F393-E0A9-E50E24DCCA9E"
#define writeUUID  @"6E400002-B5A3-F393-E0A9-E50E24DCCA9E"
#define receiveUUID  @"6E400003-B5A3-F393-E0A9-E50E24DCCA9E"
//#define serviceUUID  @"6e400001-b5a3-f393-e0a9-e50e24dcca9e"
//#define writeUUID  @"6e400002-b5a3-f393-e0a9-e50e24dcca9e"
//#define receiveUUID  @"6e400003-b5a3-f393-e0a9-e50e24dcca9e"
#define BLE_NAME_UUID  @"00001800-0000-1000-8000-00805f9b34fb"
#define BLE_NAME_CHARACTE   @"00002a00-0000-1000-8000-00805f9b34fb"

#define macAddressStr @"macAddress"
#define BLE_SEND_MAX_LEN 20

#define UpdateBLE_SEND_MAX_LEN 20

@interface RFIDBlutoothManager () <CBCentralManagerDelegate, CBPeripheralDelegate>

// @property (nonatomic, strong) CBCentralManager *centralManager; // declared in .h
@property (nonatomic, strong) NSTimer *bleScanTimer;
@property (nonatomic, strong) CBPeripheral *peripheral;

@property (nonatomic, strong) NSMutableArray *peripheralArray;
@property (nonatomic, weak) id<FatScaleBluetoothManager> managerDelegate;
@property (nonatomic, weak) id<PeripheralAddDelegate> addDelegate;

@property (nonatomic, copy) NSString *connectPeripheralCharUUID;

@property (nonatomic, strong) NSMutableArray *BLEServerDatasArray;

@property (nonatomic, strong) CBCharacteristic *myCharacteristic;
@property (nonatomic, strong) NSTimer *connectTime;//計算藍牙連接是否超時的定時器
@property (nonatomic, strong) NSTimer *sendGetTagRequestTime;//定時發送獲取標籤命令
@property (nonatomic, strong) NSMutableArray *dataList;
@property (nonatomic, strong) NSMutableString *dataStr;
@property (nonatomic, assign) NSInteger dataCount;
@property (nonatomic, strong) NSMutableArray *uuidDataList;
@property (nonatomic, copy) NSString *temStr;
@property (nonatomic, assign) BOOL isInfo;
@property (nonatomic, assign) BOOL isName;
@property (nonatomic, assign) BOOL isFirstSendGetTAGCmd;
/** isHeader */
@property (assign,nonatomic) BOOL isHeader;

@end

@implementation RFIDBlutoothManager


+ (instancetype)shareManager
{
    static RFIDBlutoothManager *shareManager = nil;
    static dispatch_once_t once;
    dispatch_once(&once, ^{
        shareManager = [[self alloc] init];
    });
    return shareManager;
}
- (instancetype)init
{
    self = [super init];
    if (self) {
         [self centralManager];
         self.dataCount=0;
         self.isInfo=NO;
         self.isSupportRssi=NO;
         self.isBLE40=NO;
         self.isName=NO;
         self.isHeader = NO;
         self.isSetGen2Data = NO;
         self.isGetGen2Data = NO;
         self.dataList=[[NSMutableArray alloc]init];
         self.dataSource=[[NSMutableArray alloc]init];
         self.dataSource1 = [NSMutableArray array];
         self.dataSource2 = [NSMutableArray array];
         self.isFirstSendGetTAGCmd=YES;
         _tagStr=[[NSMutableString alloc]init];
         _allCount=0;
         self.isgetLab=NO;
         self.countArr=[[NSMutableArray alloc]init];
         self.countArr1 = [NSMutableArray array];
         self.countArr2 = [NSMutableArray array];


    }
    return self;
}

#pragma mark - Public methods
- (void)bleDoScan
{
    self.bleScanTimer = [NSTimer scheduledTimerWithTimeInterval:1 target:self selector:@selector(startBleScan) userInfo:nil repeats:YES];
}

- (BOOL)connectPeripheralWithIdentifier:(NSString *)identifier
{
    NSUUID *uuid = [[NSUUID alloc] initWithUUIDString:identifier];

    NSArray *peripheralArray = [self.centralManager retrievePeripheralsWithIdentifiers:@[uuid]];
    if ([peripheralArray count] <= 0) {
      NSLog(@"RFIDBluetoothManager: Can't find peripheral from identifier %@", identifier);
      return NO;
    }
    CBPeripheral *peripheral = peripheralArray[0];
    if (!peripheral) {
      NSLog(@"RFIDBluetoothManager: Can't find peripheral from identifier %@", identifier);
      return NO;
    }

    [self connectPeripheral: peripheral macAddress:@""];
    return YES;
}

- (void)connectPeripheral:(CBPeripheral *)peripheral macAddress:(NSString *)macAddress
{
    NSArray *aa=[macAddress componentsSeparatedByString:@":"];
    NSMutableString *str=[[NSMutableString alloc]init];
    for (NSInteger i=0; i<aa.count; i++) {
        [str appendFormat:@"%@",aa[i]];
    }

    NSString *strr=[NSString stringWithFormat:@"%@",str];

    [[NSUserDefaults standardUserDefaults] setObject:strr forKey:macAddressStr];
    [[NSUserDefaults standardUserDefaults] synchronize];
    self.peripheral = peripheral;

    [self.centralManager connectPeripheral:peripheral options:nil];
}
- (void)cancelConnectBLE
{
    [self.centralManager cancelPeripheralConnection:self.peripheral];
}
- (void)setFatScaleBluetoothDelegate:(id<FatScaleBluetoothManager>)delegate
{
    self.managerDelegate = delegate;
}

- (void)setPeripheralAddDelegate:(id<PeripheralAddDelegate>)delegate
{
    self.addDelegate = delegate;
}



- (Byte )getBye8:(Byte[])data
{
    Byte byte8 = data[2] + data[3] + data[4] + data[5] +data[6];
    byte8 = (unsigned char) ( byte8 & 0x00ff);
    return byte8;
}

//獲取固件版本號
-(void)getFirmwareVersion2
{
     NSData *data = [BluetoothUtil getFirmwareVersion];
     [self sendDataToBle:data];
}
//獲取電池電量
-(void)getBatteryLevel
{
     self.isGetBattery = YES;
    NSData *data=[BluetoothUtil getBatteryLevel];
    [self sendDataToBle:data];

}
//獲取設備當前溫度
-(void)getServiceTemperature
{
     self.isTemperature = YES;
     NSData *data=[BluetoothUtil getServiceTemperature];
     [self sendDataToBle:data];
}
//開啓2D掃描
-(void)start2DScan
{
     self.rcodeStr=[[NSMutableString alloc]init];
     self.isCodeLab = YES;
     NSData *data=[BluetoothUtil start2DScan];
     [self sendDataToBle:data];

}

//獲取硬件版本號
-(void)getHardwareVersion
{
     self.isGetVerson = YES;
     NSData *data=[BluetoothUtil getHardwareVersion];
     [self sendDataToBle:data];

}
//獲取固件版本號
-(void)getFirmwareVersion
{
     self.isGetVerson = YES;
     NSData *data = [BluetoothUtil getFirmwareVersion];
     [self sendDataToBle:data];
}
//獲取設備ID
-(void)getServiceID
{
     NSData *data = [BluetoothUtil getServiceID];
     [self sendDataToBle:data];
}
//軟件復位
-(void)softwareReset
{
     NSData *data = [BluetoothUtil softwareReset];
     [self sendDataToBle:data];
}
//開啓蜂鳴器
-(void)setOpenBuzzer
{
     self.isOpenBuzzer = YES;
     NSData *data = [BluetoothUtil openBuzzer];
     [self sendDataToBle:data];
}
//關閉蜂鳴器
-(void)setCloseBuzzer
{
     self.isCloseBuzzer  = YES;
     NSData *data = [BluetoothUtil closeBuzzer];
     [self sendDataToBle:data];
}


//設置標籤讀取格式
-(void)setEpcTidUserWithAddressStr:(NSString *)addressStr length:(NSString *)lengthStr epcStr:(NSString *)epcStr
{
     self.isSetTag = YES;
     NSData *data = [BluetoothUtil setEpcTidUserWithAddressStr:addressStr length:lengthStr EPCStr:epcStr];
     // NSLog(@"data==%@",data);
     [self sendDataToBle:data];
}
//獲取標籤讀取格式
-(void)getEpcTidUser
{
     self.isGetTag = YES;
     NSData *data = [BluetoothUtil getEpcTidUser];
     // NSLog(@"data==%@",data);
     [self sendDataToBle:data];
}



//設置發射功率
-(void)setLaunchPowerWithstatus:(NSString *)status antenna:(NSString *)antenna readStr:(NSString *)readStr writeStr:(NSString *)writeStr
{
     self.isSetEmissionPower = YES;
     NSData *data = [BluetoothUtil setLaunchPowerWithstatus:status antenna:antenna readStr:readStr writeStr:writeStr];
     [self sendDataToBle:data];

}
//獲取當前發射功率
-(void)getLaunchPower
{
     self.isGetEmissionPower = YES;
     NSData *data = [BluetoothUtil getLaunchPower];
     [self sendDataToBle:data];

}
//跳頻設置
-(void)detailChancelSettingWithstring:(NSString *)str
{
     NSData *data = [BluetoothUtil detailChancelSettingWithstring:str];
     [self sendDataToBle:data];
}
//獲取當前跳頻設置狀態
-(void)getdetailChancelStatus
{
     NSData *data = [BluetoothUtil getdetailChancelStatus];
     [self sendDataToBle:data];
}

//區域設置
-(void)setRegionWithsaveStr:(NSString *)saveStr regionStr:(NSString *)regionStr
{
     NSData *data = [BluetoothUtil setRegionWithsaveStr:saveStr regionStr:regionStr];
     [self sendDataToBle:data];
}
//獲取區域設置
-(void)getRegion
{
     NSData *data = [BluetoothUtil getRegion];
     [self sendDataToBle:data];
}

//單次盤存標籤
-(void)singleSaveLabel
{
     self.isSingleSaveLable  = YES;
     NSData *data = [BluetoothUtil singleSaveLabel];
     [self sendDataToBle:data];
}
//********************************************
- (void)handleTimer
{
//  NSLog(@"Handle timer");
     if(self.isFirstSendGetTAGCmd==YES){
          //如果開始盤底後，馬上停止。 那麼直接退回定時器
          self.isFirstSendGetTAGCmd=NO;
          for(int k=0;k<300;k++){
               if(self.isgetLab == NO){
                    [self.sendGetTagRequestTime invalidate];
                    self.sendGetTagRequestTime=nil;
//                    NSLog(@"退出獲取標籤定時器!");
                    return;
               }
             usleep(1000);
          }
     }

     if (self.connectDevice ==YES && self.isgetLab==YES) {
//          NSLog(@"獲取標籤定時器!");
          [self getLabMessage];
     }else{
          [self.sendGetTagRequestTime invalidate];
          self.sendGetTagRequestTime=nil;
//          NSLog(@"退出獲取標籤定時器!");
     }
}
//連續盤存標籤
-(void)continuitySaveLabelWithCount:(NSString *)count
{
     //獲取藍牙版本
     //[self getFirmwareVersion];

     NSData *data = [BluetoothUtil continuitySaveLabelWithCount:count];
     [self sendDataToBle:data];

     if (self.sendGetTagRequestTime == nil){
          self.isFirstSendGetTAGCmd=YES;

          if(self.isBLE40 == YES){
              self.sendGetTagRequestTime = [NSTimer timerWithTimeInterval:0.06 target:self selector:@selector(handleTimer) userInfo:nil repeats:YES];
          }else{
               // Time interval should be 0.03 or lower to work with newer BLE models
               self.sendGetTagRequestTime = [NSTimer timerWithTimeInterval:0.02 target:self selector:@selector(handleTimer) userInfo:nil repeats:YES];
          }
//       NSRunLoop *runLoop = [NSRunLoop currentRunLoop];
//       [runLoop addTimer:self.sendGetTagRequestTime forMode:NSRunLoopCommonModes];
//       [runLoop addPort:[NSMachPort port] forMode:NSRunLoopCommonModes];
//       [runLoop run];
       [[NSRunLoop mainRunLoop] addTimer:self.sendGetTagRequestTime forMode:NSRunLoopCommonModes];
     }

}

//停止連續盤存標籤
-(void)stopContinuitySaveLabel
{
     NSData *data = [BluetoothUtil StopcontinuitySaveLabel];
     [self sendDataToBle:data];
}
//讀標籤數據區
-(void)readLabelMessageWithPassword:(NSString *)password MMBstr:(NSString *)MMBstr MSAstr:(NSString *)MSAstr MDLstr:(NSString *)MDLstr MDdata:(NSString *)MDdata MBstr:(NSString *)MBstr SAstr:(NSString *)SAstr DLstr:(NSString *)DLstr isfilter:(BOOL)isfilter
{
          // NSLog(@"readLabelMessageWithPassword: %@, %@, %@, %@, %@, %@, %@, %@, %d", password, MMBstr, MSAstr, MDLstr, MDdata, MBstr, SAstr, DLstr, isfilter);
          NSData *data = [BluetoothUtil readLabelMessageWithPassword:password MMBstr:MMBstr MSAstr:MSAstr MDLstr:MDLstr MDdata:MDdata MBstr:MBstr SAstr:SAstr DLstr:DLstr isfilter:isfilter];
          // NSLog(@"data===%@",data);
          for (int i = 0; i < [data length]; i += BLE_SEND_MAX_LEN) {
               // 預加 最大包長度，如果依然小於總數據長度，可以取最大包數據大小
               if ((i + BLE_SEND_MAX_LEN) < [data length]) {
                    NSString *rangeStr = [NSString stringWithFormat:@"%i,%i", i, BLE_SEND_MAX_LEN];
                    NSData *subData = [data subdataWithRange:NSRangeFromString(rangeStr)];
                    // NSLog(@"%@",subData);
                    [self sendDataToBle:subData];
                    //根據接收模塊的處理能力做相應延時
                    usleep(80 * 1000);
               }
               else {
                    NSString *rangeStr = [NSString stringWithFormat:@"%i,%i", i, (int)([data length] - i)];
                    NSData *subData = [data subdataWithRange:NSRangeFromString(rangeStr)];
                    [self sendDataToBle:subData];
                    usleep(80 * 1000);
               }
          }
}
//寫標籤數據區
-(void)writeLabelMessageWithPassword:(NSString *)password MMBstr:(NSString *)MMBstr MSAstr:(NSString *)MSAstr MDLstr:(NSString *)MDLstr MDdata:(NSString *)MDdata MBstr:(NSString *)MBstr SAstr:(NSString *)SAstr DLstr:(NSString *)DLstr writeData:(NSString *)writeData isfilter:(BOOL)isfilter
{
          NSData *data = [BluetoothUtil writeLabelMessageWithPassword:password MMBstr:MMBstr MSAstr:MSAstr MDLstr:MDLstr MDdata:MDdata MBstr:MBstr SAstr:SAstr DLstr:DLstr writeData:writeData isfilter:isfilter];

          // NSLog(@"Write NSData: %@", data);
          for (int i = 0; i < [data length]; i += BLE_SEND_MAX_LEN) {
               // 預加 最大包長度，如果依然小於總數據長度，可以取最大包數據大小
               if ((i + BLE_SEND_MAX_LEN) < [data length]) {
                    NSString *rangeStr = [NSString stringWithFormat:@"%i,%i", i, BLE_SEND_MAX_LEN];
                    NSData *subData = [data subdataWithRange:NSRangeFromString(rangeStr)];
//                      NSLog(@"1 subData == %@",subData);
                    [self sendDataToBle:subData];
                    //根據接收模塊的處理能力做相應延時
                    usleep(80 * 1000);
               }
               else {
                    NSString *rangeStr = [NSString stringWithFormat:@"%i,%i", i, (int)([data length] - i)];
                    NSData *subData = [data subdataWithRange:NSRangeFromString(rangeStr)];
//                     NSLog(@"2 subData == %@",subData);
                    [self sendDataToBle:subData];
                    usleep(80 * 1000);
               }
          }
}
//Lock標籤
-(void)lockLabelWithPassword:(NSString *)password MMBstr:(NSString *)MMBstr MSAstr:(NSString *)MSAstr MDLstr:(NSString *)MDLstr MDdata:(NSString *)MDdata ldStr:(NSString *)ldStr isfilter:(BOOL)isfilter
{
     NSData *data=[BluetoothUtil lockLabelWithPassword:password MMBstr:MMBstr MSAstr:MSAstr MDLstr:MDLstr MDdata:MDdata ldStr:ldStr isfilter:isfilter];
     // NSLog(@"data===%@",data);
     for (int i = 0; i < [data length]; i += BLE_SEND_MAX_LEN) {
          // 預加 最大包長度，如果依然小於總數據長度，可以取最大包數據大小
          if ((i + BLE_SEND_MAX_LEN) < [data length]) {
               NSString *rangeStr = [NSString stringWithFormat:@"%i,%i", i, BLE_SEND_MAX_LEN];
               NSData *subData = [data subdataWithRange:NSRangeFromString(rangeStr)];
               // NSLog(@"%@",subData);
               [self sendDataToBle:subData];
               //根據接收模塊的處理能力做相應延時
               usleep(80 * 1000);
          }
          else {
               NSString *rangeStr = [NSString stringWithFormat:@"%i,%i", i, (int)([data length] - i)];
               NSData *subData = [data subdataWithRange:NSRangeFromString(rangeStr)];
               [self sendDataToBle:subData];
               usleep(80 * 1000);
          }
     }
}//
//kill標籤。
-(void)killLabelWithPassword:(NSString *)password MMBstr:(NSString *)MMBstr MSAstr:(NSString *)MSAstr MDLstr:(NSString *)MDLstr MDdata:(NSString *)MDdata isfilter:(BOOL)isfilter
{
     NSData *data = [BluetoothUtil killLabelWithPassword:password MMBstr:MMBstr MSAstr:MSAstr MDLstr:MDLstr MDdata:MDdata isfilter:isfilter];
     // NSLog(@"data===%@",data);
     for (int i = 0; i < [data length]; i += BLE_SEND_MAX_LEN) {
          // 預加 最大包長度，如果依然小於總數據長度，可以取最大包數據大小
          if ((i + BLE_SEND_MAX_LEN) < [data length]) {
               NSString *rangeStr = [NSString stringWithFormat:@"%i,%i", i, BLE_SEND_MAX_LEN];
               NSData *subData = [data subdataWithRange:NSRangeFromString(rangeStr)];
               // NSLog(@"%@",subData);
               [self sendDataToBle:subData];
               //根據接收模塊的處理能力做相應延時
               usleep(80 * 1000);
          }
          else {
               NSString *rangeStr = [NSString stringWithFormat:@"%i,%i", i, (int)([data length] - i)];
               NSData *subData = [data subdataWithRange:NSRangeFromString(rangeStr)];
               [self sendDataToBle:subData];
               usleep(80 * 1000);
          }
     }
}
//獲取標籤數據
-(void)getLabMessage
{
     NSData *data = [BluetoothUtil getLabMessage];
     [self sendDataToBle:data];
}
//設置密鑰
-(void)setSM4PassWordWithmodel:(NSString *)model password:(NSString *)password originPass:(NSString *)originPass
{
      NSData *data = [BluetoothUtil setSM4PassWordWithmodel:model password:password originPass:originPass];

     for (int i = 0; i < [data length]; i += BLE_SEND_MAX_LEN) {
          // 預加 最大包長度，如果依然小於總數據長度，可以取最大包數據大小
          if ((i + BLE_SEND_MAX_LEN) < [data length]) {
               NSString *rangeStr = [NSString stringWithFormat:@"%i,%i", i, BLE_SEND_MAX_LEN];
               NSData *subData = [data subdataWithRange:NSRangeFromString(rangeStr)];
               // NSLog(@"%@",subData);
                [self sendDataToBle:subData];
               //根據接收模塊的處理能力做相應延時
               usleep(80 * 1000);

          }
          else {
               NSString *rangeStr = [NSString stringWithFormat:@"%i,%i", i, (int)([data length] - i)];
               NSData *subData = [data subdataWithRange:NSRangeFromString(rangeStr)];
                [self sendDataToBle:subData];
               usleep(80 * 1000);
          }
     }
}
//獲取密鑰
-(void)getSM4PassWord
{
     NSData *data = [BluetoothUtil getSM4PassWord];
     [self sendDataToBle:data];
}
//SM4數據加密
-(void)encryptionPassWordwithmessage:(NSString *)message
{
     NSData *data = [BluetoothUtil encryptionPassWordwithmessage:message];
     // NSLog(@"data===%@",data);
     for (int i = 0; i < [data length]; i += BLE_SEND_MAX_LEN) {
          // 預加 最大包長度，如果依然小於總數據長度，可以取最大包數據大小
          if ((i + BLE_SEND_MAX_LEN) < [data length]) {
               NSString *rangeStr = [NSString stringWithFormat:@"%i,%i", i, BLE_SEND_MAX_LEN];
               NSData *subData = [data subdataWithRange:NSRangeFromString(rangeStr)];
               // NSLog(@"%@",subData);
               [self sendDataToBle:subData];
               //根據接收模塊的處理能力做相應延時
               usleep(80 * 1000);
          }
          else {
               NSString *rangeStr = [NSString stringWithFormat:@"%i,%i", i, (int)([data length] - i)];
               NSData *subData = [data subdataWithRange:NSRangeFromString(rangeStr)];
               [self sendDataToBle:subData];
               usleep(80 * 1000);
          }
     }
}
//SM4數據解密
-(void)decryptPassWordwithmessage:(NSString *)message
{
     NSData *data = [BluetoothUtil decryptPassWordwithmessage:message];
     for (int i = 0; i < [data length]; i += BLE_SEND_MAX_LEN) {
          // 預加 最大包長度，如果依然小於總數據長度，可以取最大包數據大小
          if ((i + BLE_SEND_MAX_LEN) < [data length]) {
               NSString *rangeStr = [NSString stringWithFormat:@"%i,%i", i, BLE_SEND_MAX_LEN];
               NSData *subData = [data subdataWithRange:NSRangeFromString(rangeStr)];
               // NSLog(@"%@",subData);
               [self sendDataToBle:subData];
               //根據接收模塊的處理能力做相應延時
               usleep(80 * 1000);
          }
          else {
               NSString *rangeStr = [NSString stringWithFormat:@"%i,%i", i, (int)([data length] - i)];
               NSData *subData = [data subdataWithRange:NSRangeFromString(rangeStr)];
               [self sendDataToBle:subData];
               usleep(80 * 1000);
          }
     }
}
//USER加密
-(void)encryptionUSERWithaddress:(NSString *)address lengthStr:(NSString *)lengthStr dataStr:(NSString *)dataStr
{
     NSData *data = [BluetoothUtil encryptionUSERWithaddress:address lengthStr:lengthStr dataStr:dataStr];
     // NSLog(@"data===%@",data);
     for (int i = 0; i < [data length]; i += BLE_SEND_MAX_LEN) {
          // 預加 最大包長度，如果依然小於總數據長度，可以取最大包數據大小
          if ((i + BLE_SEND_MAX_LEN) < [data length]) {
               NSString *rangeStr = [NSString stringWithFormat:@"%i,%i", i, BLE_SEND_MAX_LEN];
               NSData *subData = [data subdataWithRange:NSRangeFromString(rangeStr)];
              NSLog(@"%@",subData);
               [self sendDataToBle:subData];
               //根據接收模塊的處理能力做相應延時
               usleep(80 * 1000);
          }
          else {
               NSString *rangeStr = [NSString stringWithFormat:@"%i,%i", i, (int)([data length] - i)];
               NSData *subData = [data subdataWithRange:NSRangeFromString(rangeStr)];
               [self sendDataToBle:subData];
               usleep(80 * 1000);
          }
     }
}
//USER解密
-(void)decryptUSERWithaddress:(NSString *)address lengthStr:(NSString *)lengthStr
{
     NSData *data = [BluetoothUtil decryptUSERWithaddress:address lengthStr:lengthStr];
     [self sendDataToBle:data];
}
//進入升級模式
-(void)enterUpgradeMode
{
     NSData *data=[BluetoothUtil enterUpgradeMode];
     [self sendDataToBle:data];
}
//進入升級接收數據
-(void)enterUpgradeAcceptData
{
     NSData *data=[BluetoothUtil enterUpgradeAcceptData];
     [self sendDataToBle:data];
}

//進入升級發送數據
-(void)enterUpgradeSendtDataWith:(NSString *)dataStr
{
     NSData *data=[BluetoothUtil enterUpgradeSendtDataWith:dataStr];
     // NSLog(@"data===%@",data);
     for (int i = 0; i < [data length]; i += BLE_SEND_MAX_LEN) {
          // 預加 最大包長度，如果依然小於總數據長度，可以取最大包數據大小
          if ((i + BLE_SEND_MAX_LEN) < [data length]) {
               NSString *rangeStr = [NSString stringWithFormat:@"%i,%i", i, BLE_SEND_MAX_LEN];
               NSData *subData = [data subdataWithRange:NSRangeFromString(rangeStr)];
               NSLog(@"%@",subData);
               [self sendDataToBle:subData];
               //根據接收模塊的處理能力做相應延時
               usleep(80 * 1000);
          }
          else {
               NSString *rangeStr = [NSString stringWithFormat:@"%i,%i", i, (int)([data length] - i)];
               NSData *subData = [data subdataWithRange:NSRangeFromString(rangeStr)];
               [self sendDataToBle:subData];
               usleep(80 * 1000);
          }
     }
}
//發送升級數據
-(void)sendtUpgradeDataWith:(NSData *)dataStr
{
     //
     NSData *data = dataStr;
     // NSLog(@"data===%@",data);
     for (int i = 0; i < [data length]; i += UpdateBLE_SEND_MAX_LEN) {
          // 預加 最大包長度，如果依然小於總數據長度，可以取最大包數據大小
          if ((i + UpdateBLE_SEND_MAX_LEN) < [data length]) {
               NSString *rangeStr = [NSString stringWithFormat:@"%i,%i", i, UpdateBLE_SEND_MAX_LEN];
               NSData *subData = [data subdataWithRange:NSRangeFromString(rangeStr)];
               NSLog(@"%@",subData);
               [self sendDataToBle:subData];
               //根據接收模塊的處理能力做相應延時
               usleep(80 * 1000);
          }
          else {
               NSString *rangeStr = [NSString stringWithFormat:@"%i,%i", i, (int)([data length] - i)];
               NSData *subData = [data subdataWithRange:NSRangeFromString(rangeStr)];
               [self sendDataToBle:subData];
               usleep(80 * 1000);
          }
     }
}
//退出升級模式
-(void)exitUpgradeMode
{
     NSData *data=[BluetoothUtil exitUpgradeMode];
     // NSLog(@"data===%@",data);
     [self sendDataToBle:data];
}

#pragma mark - Private Methods
- (void)startBleScan
{
    [self.bleScanTimer invalidate];
    if (self.centralManager.state != CBManagerStatePoweredOn) {
        self.connectDevice = NO;
        if ([self.managerDelegate respondsToSelector:@selector(connectBluetoothFailWithMessage:)])
        {
            [self.managerDelegate connectBluetoothFailWithMessage:[self centralManagerStateDescribe:CBCentralManagerStatePoweredOff]];
        }

        self.bleScanTimer = [NSTimer timerWithTimeInterval:0.5 target:self selector:@selector(startBleScan) userInfo:nil repeats:NO];
        [[NSRunLoop mainRunLoop] addTimer:self.bleScanTimer forMode:NSRunLoopCommonModes];
        NSLog(@"RFIDBluetoothManager: startBleScan: state is not powered on, retry in 0.5 seconds");
        // Timeout of retrying
        if (!_connectTime || ![_connectTime isValid]) {
          _connectTime = [NSTimer timerWithTimeInterval:kFatscaleTimeOut target:self selector:@selector(connectTimeroutEvent) userInfo:nil repeats:NO];
          [[NSRunLoop mainRunLoop] addTimer:_connectTime forMode:NSRunLoopCommonModes];
        }
        return;
    }
  [_connectTime invalidate];
//    if (_connectTime == nil)
//    {
        //創建連接制定設備的定時器
        _connectTime = [NSTimer timerWithTimeInterval:kFatscaleTimeOut target:self selector:@selector(connectTimeroutEvent) userInfo:nil repeats:NO];
  [[NSRunLoop mainRunLoop] addTimer:_connectTime forMode:NSRunLoopCommonModes];
//    }
    self.uuidDataList=[[NSMutableArray alloc]init];
    [self.centralManager scanForPeripheralsWithServices:nil options:@{CBCentralManagerScanOptionAllowDuplicatesKey : @ YES}];
}
- (void)connectTimeroutEvent
{
  NSLog(@"RFIDBluetoothManager: connectTimeroutEvent triggered");
    [_connectTime invalidate];
    _connectTime = nil;
    [self stopBleScan];
  if (!self.connectDevice) {
    if ([self.managerDelegate respondsToSelector:@selector(connectBluetoothFailWithMessage:)])
    {
      [self.managerDelegate connectBluetoothFailWithMessage:@"TIMEOUT"];
    }
  }
//    [self.centralManager stopScan];
//    [self.managerDelegate receiveDataWithBLEmodel:nil result:@"1"];
}

- (void)stopBleScan
{
    [_connectTime invalidate];
    [self.bleScanTimer invalidate];
    [self.centralManager stopScan];
}

- (void)closeBleAndDisconnect
{
    [self stopBleScan];
    [self.centralManager stopScan];
    if (self.peripheral) {
        [self.centralManager cancelPeripheralConnection:self.peripheral];
    }
}
//Nordic_UART_CW HotWaterBottle
- (void)sendDataToBle:(NSData *)data
{
     dispatch_async(dispatch_get_main_queue(), ^{
        [self.peripheral writeValue:data forCharacteristic:self.myCharacteristic type:CBCharacteristicWriteWithoutResponse];
     });
}


#pragma maek - CBCentralManagerDelegate

- (void)centralManagerDidUpdateState:(CBCentralManager *)central
{
    if (central.state != CBManagerStatePoweredOn)
    {
        if ([self.managerDelegate respondsToSelector:@selector(connectBluetoothFailWithMessage:)])
        {
            if (central.state == CBManagerStatePoweredOff)
            {
                self.connectDevice = NO;
                [self.managerDelegate connectBluetoothFailWithMessage:[self centralManagerStateDescribe:CBManagerStatePoweredOff]];
            }
        }

    }

//    switch (central.state) {
//        case CBManagerStatePoweredOn:
//             NSLog(@"CBManagerStatePoweredOn");
//            break;
//        case CBManagerStatePoweredOff:
//             NSLog(@"CBManagerStatePoweredOff");
//            break;
//        default:
//            break;
//    }
}

#pragma mark - 掃描到設備
- (void)centralManager:(CBCentralManager *)central
 didDiscoverPeripheral:(CBPeripheral *)peripheral
     advertisementData:(NSDictionary<NSString *,id> *)advertisementData
                  RSSI:(NSNumber *)RSSI
{
    NSData *manufacturerData = [advertisementData valueForKeyPath:CBAdvertisementDataManufacturerDataKey];

    if (advertisementData.description.length > 0)
    {
        // NSLog(@"/-------advertisementData:%@--------",advertisementData.description);
        // NSLog(@"-------peripheral:%@--------/",peripheral.description);
        // NSLog(@"peripheral.services==%@",peripheral.identifier.UUIDString);
        // NSLog(@"RSSI==%@",RSSI);
    }

//    NSString *bindString = @"";
    NSString *str = @"";
//    if (manufacturerData.length>=8) {
//        NSData *subData = [manufacturerData subdataWithRange:NSMakeRange(manufacturerData.length-8, 8)];
//        bindString = subData.description;
//        str = [self getVisiableIDUUID:bindString];
//        // NSLog(@" GG == %@ == GG",str);
//
//    }
    str = [peripheral.identifier UUIDString];

    NSString *typeStr=@"1";
    for (NSString *uuidStr in self.uuidDataList) {
        if ([peripheral.identifier.UUIDString isEqualToString:uuidStr]) {
            typeStr=@"2";
        }
    }
    if ([typeStr isEqualToString:@"1"]) {
        [self.uuidDataList addObject:peripheral.identifier.UUIDString];

        BLEModel *model=[BLEModel new];
        model.nameStr=peripheral.name;
        model.rssStr=[NSString stringWithFormat:@"%@",RSSI];
        model.addressStr=str;
        model.peripheral=peripheral;
        [self.managerDelegate receiveDataWithBLEmodel:model result:@"0"];
    }


}
//連接外設成功
- (void)centralManager:(CBCentralManager *)central didConnectPeripheral:(CBPeripheral *)peripheral
{
    self.connectDevice = YES;
    // NSLog(@"-- 成功連接外設 --：%@",peripheral.name);
    // NSLog(@"Did connect to peripheral: %@",peripheral);
    peripheral.delegate = self;
    [peripheral discoverServices:nil];
    [self.centralManager stopScan];
    [self stopBleScan];

    [self.managerDelegate connectPeripheralSuccess:peripheral];
}

//斷開外設連接
- (void)centralManager:(CBCentralManager *)central didDisconnectPeripheral:(CBPeripheral *)peripheral error:(NSError *)error
{
    self.connectDevice = NO;
    // LogRed(@"藍牙已斷開");
    [self.managerDelegate disConnectPeripheral];

}

//連接外設失敗
- (void)centralManager:(CBCentralManager *)central didFailToConnectPeripheral:(CBPeripheral *)peripheral error:(NSError *)error
{
    // LogRed(@"-- 連接失敗 --");
     self.connectDevice = NO;

}

#pragma mark - CBPeripheralDelegate
//發現服務時調用的方法
- (void)peripheral:(CBPeripheral *)peripheral didDiscoverServices:(NSError *)error
{
    NSLog(@"%s", __func__);
    NSLog(@"error：%@", error);
     NSLog(@"-==----includeServices = %@",peripheral.services);
    for (CBService *service in peripheral.services) {
        [peripheral  discoverCharacteristics:nil forService:service];

    }
}

//發現服務的特徵值後回調的方法
- (void)peripheral:(CBPeripheral *)peripheral didDiscoverCharacteristicsForService:(CBService *)service error:(NSError *)error
{
    for (CBCharacteristic *c in service.characteristics) {
        [peripheral discoverDescriptorsForCharacteristic:c];
    }

    if ([service.UUID.UUIDString isEqualToString:serviceUUID]) {
        for (CBCharacteristic *characteristic in service.characteristics) {

            if ([characteristic.UUID.UUIDString isEqualToString:writeUUID]) {

                if (characteristic) {
                    self.myCharacteristic  = characteristic;
                }
            }
            if ([characteristic.UUID.UUIDString isEqualToString:receiveUUID]) {

                if (characteristic) {
                    [peripheral setNotifyValue:YES forCharacteristic:characteristic];
                }
            }
        }
    }
     if ([service.UUID.UUIDString isEqualToString:BLE_NAME_UUID]) {
          NSLog(@"-----=====find BLE NAME UUID Service");
          for (CBCharacteristic *characteristic in service.characteristics) {
               if ([characteristic.UUID.UUIDString isEqualToString:BLE_NAME_CHARACTE]) {
                    if (characteristic) {
                         //[peripheral setValue:@"" forKey:BLE_NAME_CHARACTE];
                    }
               }
          }
     }
}

- (void)peripheral:(CBPeripheral *)peripheral didUpdateNotificationStateForCharacteristic:(CBCharacteristic *)characteristic error:(NSError *)error
{
    // NSLog(@"didUpdateNotificationStateForCharacteristic: %@",characteristic.value);
}

//*******************解析按鍵*************************
const NSInteger dataKeyBuffLen=9;
Byte dataKey[9];
NSInteger dataIndex=0;
- (void) getKeyData:(Byte*) data {
      //A5 5A 00 09 E6 04 EB0D0A
     int flag = 0;
     int keyCode = 0;
     int checkCode = 0;//校驗碼
     for (int k = 0; k < dataKeyBuffLen; k++) {
          int temp = (data[k] & 0xff);
          switch (flag) {
               case 0:
                    if(temp == 0xC8){
                         flag = 1;
                    }else if(temp == 0xA5){
                         flag = 111;
                    }
                    break;
               case 111:
                    flag = (temp == 0x5A) ? 2 : 0;
                    break;
               case 1:
                    flag = (temp == 0x8C) ? 2 : 0;
                    break;
               case 2:
                    flag = (temp == 0x00) ? 3 : 0;
                    break;
               case 3:
                    flag = (temp == 0x09) ? 4 : 0;
                    break;
               case 4:
                    flag = (temp == 0xE6) ? 5 : 0;
                    break;
               case 5:
                    flag = (temp == 0x01 || temp == 0x02 || temp == 0x03 || temp == 0x04) ? 6 : 0;
                    keyCode = data[k];
                    break;
               case 6:
                    checkCode = checkCode ^ 0x00;
                    checkCode = checkCode ^ 0x09;
                    checkCode = checkCode ^ 0xE6;
                    checkCode = checkCode ^ keyCode;
                    flag = (temp == checkCode) ? 7 : 0;
                    break;
               case 7:
                    flag = (temp == 0x0D) ? 8 : 0;
                    break;
               case 8:
                    flag = (temp == 0x0A) ? 9 : 0;
                    break;
          }
          if (flag == 9)
               break;
     }
     if (flag == 9) {
         NSLog(@"按下掃描按鍵");
          [self.managerDelegate receiveMessageWithtype:@"e6" dataStr:@""];
     }

}


-(void) parseKeyDown:(NSData *) data{
    Byte *tempBytes = (Byte *)data.bytes;
     for (int k = 0; k < data.length; k++) {
          dataKey[dataIndex++]=tempBytes[k];
          if(dataIndex>=dataKeyBuffLen){
               dataIndex=dataKeyBuffLen-1;
               if(dataKey[0]== 0xC8 && dataKey[1]==0x8c && dataKey[4]==0xE6 && dataKey[dataKeyBuffLen-2]==0x0D  && dataKey[dataKeyBuffLen-1]==0x0A){
                   [self getKeyData:dataKey];
               }else if(dataKey[0]== 0xA5 && dataKey[1]==0x5A && dataKey[4]==0xE6 && dataKey[dataKeyBuffLen-2]==0x0D  && dataKey[dataKeyBuffLen-1]==0x0A){
                    [self getKeyData:dataKey];
               }
               for(int s=0;s<dataKeyBuffLen-1;s++){
                    dataKey[s]=dataKey[s+1];
               }
          }

     }
}
//******************************************************

//特徵值更新時回調的方法
#pragma mark - 接收數據
- (void)peripheral:(CBPeripheral *)peripheral didUpdateValueForCharacteristic:(CBCharacteristic *)characteristic error:(NSError *)error
{
     NSString *dataStr=[AppHelper dataToHex:characteristic.value];
//  NSLog(@"Got peripheral data: %@", dataStr);
    //TODO NSLog(@"====>>>>>>>>characteristic.value=%@",dataStr);
     //解析按鍵
     [self parseKeyDown:characteristic.value];

     NSString *typeStr;
     if (dataStr.length>10) {
          typeStr=[dataStr substringWithRange:NSMakeRange(8, 2)];
     } else {
          typeStr=@"10000";
     }


     if (self.singleLableStr.length>0) {
          //單次盤點n標籤
          [self.singleLableStr appendString:dataStr];
               if (dataStr.length<40) {
                    //NSLog(@"self.singleLableStr===%@",self.singleLableStr);
                    //  天線號 1 個字節,信號值 2 個字節,1個字節校驗碼,2個字節 RSSI
                    //       數據長度（2字節）  cmd      pc(2字節)              epc                     rssi(2字節)   ant((2字節))     crc(1字節)
                    //c8 8c    00 19          81      34 00     39 31 31 31 32 32 32 32 33 33 33 34     fe b7      01               eb          0d 0a
                    //                                34 00     39 31 31 31 32 32 32 32 33 33 33 34     fe 54      01
                     NSData *rawData=[AppHelper hexToNSData:self.singleLableStr];
                     NSData *tagTempData = [self parseDataWithOriginalStr:rawData cmd:0x81];

                   //  NSLog(@"singleLableStr= %@",self.singleLableStr);
                   //  NSLog(@"data= %@",[AppHelper dataToHex:tagTempData]);
                   //  NSLog(@"rawData.length= %d",(int)rawData.length);
                   //  NSLog(@"data.length= %d",(int)tagTempData.length);
                   [self parseSingleLabel:tagTempData];
                   self.singleLableStr=[[NSMutableString alloc]init];
                   self.isSingleSaveLable = NO;
             }
     }

     if (self.readStr.length>0) {
          //讀標籤
          [self.readStr appendString:dataStr];
       NSLog(@"RFIDBluetoothManager: [self.readStr appendString:dataStr];, dataStr.length = %lu", (unsigned long)dataStr.length);
          if (dataStr.length<40) {
               NSString *aa=[NSString stringWithFormat:@"%@",self.readStr];
               NSString *valueStr=[aa substringWithRange:NSMakeRange(18, aa.length-18-6)];
               [self.managerDelegate receiveMessageWithtype:@"85" dataStr:valueStr];
               self.readStr=[[NSMutableString alloc]init];
          }
     }

     if (self.rcodeStr.length>0) {
//          NSLog(@"掃描二維碼=%@",dataStr);
//
//          [self.rcodeStr appendString:dataStr];
//          NSData *rawData=[AppHelper hexToNSData:self.rcodeStr];
//          NSData *parsedData = [self parseDataWithOriginalStr:rawData cmd:0xE5];
//
//          if (parsedData && parsedData.length > 0) {
//               //NSLog(@"掃描二維碼111111111111111 len=%d",parsedData.length);
//               //NSLog(@"掃描二維碼=%@",[AppHelper dataToHex:parsedData]);
//               Byte *bytes = (Byte *)parsedData.bytes;
//               if (bytes[0] == 0x02) {
//                    NSString *barcode = [[NSString alloc]initWithData:parsedData encoding:NSASCIIStringEncoding];
//
//                    if (self.QRCodeSelType == selectedTypeOfUTF8) {
//                         barcode = [[NSString alloc]initWithData:parsedData encoding:NSUTF8StringEncoding];
//                    } else if (self.QRCodeSelType == selectedTypeOfGB2312) {
//                         NSStringEncoding enc = CFStringConvertEncodingToNSStringEncoding(kCFStringEncodingGB_18030_2000);
//                         barcode = [[NSString alloc]initWithData:parsedData encoding:enc];
//                    }
//
//                    NSLog(@"掃描二維碼222=%@",barcode);
//                    self.isCodeLab=NO;
//                    self.rcodeStr=[[NSMutableString alloc]init];
//                    [self.managerDelegate receiveMessageWithtype:@"e55" dataStr:barcode];
//               }
//          }
          /*
          //二維碼
          [self.rcodeStr appendString:dataStr];
          if (dataStr.length<40) {
               NSLog(@"66666");
               NSString *aa=[NSString stringWithFormat:@"%@",self.rcodeStr];
               if (self.QRCodeSelType == selectedTypeOfDefault) {
                    aa = [NSString stringWithFormat:@"%@",self.rcodeStr];
               } else if (self.QRCodeSelType == selectedTypeOfUTF8) {
                    NSData *data = [self.rcodeStr dataUsingEncoding:NSUTF8StringEncoding];
                    aa = [[NSString alloc]initWithData:data encoding:NSUTF8StringEncoding];
               } else if (self.QRCodeSelType == selectedTypeOfGB2312) {
                    NSData *data = [self.rcodeStr dataUsingEncoding:NSUTF8StringEncoding];
                    NSStringEncoding enc = CFStringConvertEncodingToNSStringEncoding(kCFStringEncodingGB_18030_2000);
                    aa = [[NSString alloc] initWithData:data encoding:enc];
               }
               NSString *valueStr=[aa substringWithRange:NSMakeRange(12, aa.length-12-6)];
               NSMutableString *strrr=[[NSMutableString alloc]init];

               char *myBuffer = (char *)malloc((int)[valueStr length] / 2 + 1);
                   bzero(myBuffer, [valueStr length] / 2 + 1);
                   for (int i = 0; i < [valueStr length] - 1; i += 2) {
                   unsigned int anInt;
                   NSString * hexCharStr = [valueStr substringWithRange:NSMakeRange(i, 2)];
                   NSScanner * scanner = [[NSScanner alloc] initWithString:hexCharStr];
                   [scanner scanHexInt:&anInt];
                   myBuffer[i / 2] = (char)anInt;
                   }
                   NSString *unicodeString = [NSString stringWithCString:myBuffer encoding:4];
                   NSLog(@"------字符串=======%@",unicodeString);

               NSString *strrrr=[NSString stringWithFormat:@"%@",unicodeString];
               [self.managerDelegate receiveMessageWithtype:@"e55" dataStr:strrrr];
               self.rcodeStr=[[NSMutableString alloc]init];
               self.isCodeLab = NO;
          }
          */

     }

     if (self.isgetLab==NO) {
          NSLog(@"RFIDBluetoothManager: received data (!getLab) type: %@, data: %@", typeStr, dataStr);
//          int i=0;
          //不是獲取標籤的
          if ([typeStr isEqualToString:@"01"]) {
               //獲取硬件版本號
               if (self.isGetVerson) {
                    NSString *strr=[dataStr substringWithRange:NSMakeRange(10, 6)];
                    [self.managerDelegate receiveMessageWithtype:@"01" dataStr:strr];
                    self.isGetVerson = NO;
               }

          } else if ([typeStr isEqualToString:@"03"]) {
               if (self.isGetVerson) {
                    //獲取固件版本號
                    NSString *str1=[dataStr substringWithRange:NSMakeRange(10, 2)];
                    NSString *str2=[dataStr substringWithRange:NSMakeRange(12, 2)];
                    NSString *str3=[dataStr substringWithRange:NSMakeRange(14, 2)];
                    NSString *strr=[NSString stringWithFormat:@"V%ld.%ld%ld",(long)str1.integerValue,(long)str2.integerValue,(long)str3.integerValue];
                    [self.managerDelegate receiveMessageWithtype:@"03" dataStr:strr];
                    self.isGetVerson = NO;
               }

          } else if ([typeStr isEqualToString:@"c9"]) {
               //獲取升級固件版本號
               NSString *strr=[dataStr substringWithRange:NSMakeRange(10, 6)];
               [self.managerDelegate receiveMessageWithtype:@"c9" dataStr:strr];
          } else if ([typeStr isEqualToString:@"05"]) {
               //獲取設備ID
               NSString *strr=[dataStr substringWithRange:NSMakeRange(10, 8)];
               NSLog(@"strr==%@",strr);
          } else if ([typeStr isEqualToString:@"11"]) {
               if (self.isSetEmissionPower) {
                    //設置發射功率
                    NSString *strr=[dataStr substringWithRange:NSMakeRange(10, 2)];
                    if ([strr isEqualToString:@"01"]) {
                         [self.managerDelegate receiveMessageWithtype:@"11" dataStr:@"Set power successfully"];
                    }
                    else
                    {
                         [self.managerDelegate receiveMessageWithtype:@"11" dataStr:@"Power setting fails"];
                    }
                    self.isSetEmissionPower = NO;
               }

          } else if ([typeStr isEqualToString:@"13"]) {
               if (self.isGetEmissionPower) {
                    //獲取當前發射功率
                    NSInteger a=[BluetoothUtil getzhengshuWith:[dataStr substringWithRange:NSMakeRange(14, 1)]];
                    NSInteger b=[BluetoothUtil getzhengshuWith:[dataStr substringWithRange:NSMakeRange(15, 1)]];
                    NSInteger c=[BluetoothUtil getzhengshuWith:[dataStr substringWithRange:NSMakeRange(16, 1)]];
                    NSInteger d=[BluetoothUtil getzhengshuWith:[dataStr substringWithRange:NSMakeRange(17, 1)]];
                    NSInteger count=(a*16*16*16+b*16*16+c*16+d)/100;
                    [self.managerDelegate receiveMessageWithtype:@"13" dataStr:[NSString stringWithFormat:@"%ld",count]];
                    self.isGetEmissionPower = YES;
               }


          } else if ([typeStr isEqualToString:@"15"]) {
               //跳頻設置
               NSString *strr=[dataStr substringWithRange:NSMakeRange(10, 2)];
               if ([strr isEqualToString:@"01"]) {
                    NSLog(@"跳頻設置成功");
                    [self.managerDelegate receiveMessageWithtype:@"15" dataStr:@"Set the frequency point successfully"];
               }
               else
               {
                    NSLog(@"跳頻設置失敗");
                     [self.managerDelegate receiveMessageWithtype:@"15" dataStr:@"Failed to set frequency point"];
               }
          } else if ([typeStr isEqualToString:@"2d"]) {
               if (self.isRegion) {
                    // 區域設置
                    NSString *strr=[dataStr substringWithRange:NSMakeRange(10, 2)];
                    if ([strr isEqualToString:@"01"]) {
                         NSLog(@"區域設置成功");

                         [self.managerDelegate receiveMessageWithtype:@"2d" dataStr:@"Set frequency successfully"];
                    }
                    else
                    {
                         [self.managerDelegate receiveMessageWithtype:@"2d" dataStr:@"Failed to set frequency"];
                    }
                    self.isRegion = NO;
               }

          } else if ([typeStr isEqualToString:@"2f"]) {
               //獲取區域設置
               NSString *strr=[dataStr substringWithRange:NSMakeRange(10, 2)];
               if ([strr isEqualToString:@"01"]) {
                    NSLog(@"區域設置成功");
                    NSString *valueStr=[dataStr substringWithRange:NSMakeRange(12, 2)];
                    NSString *messageStr;
                    if ([valueStr isEqualToString:@"01"]) {
                         messageStr=@"0";
                    }
                    else if ([valueStr isEqualToString:@"02"])
                    {
                          messageStr=@"1";
                    }
                    else if ([valueStr isEqualToString:@"04"])
                    {
                          messageStr=@"2";
                    }
                    else if ([valueStr isEqualToString:@"08"])
                    {
                          messageStr=@"3";
                    }
                    else if ([valueStr isEqualToString:@"16"])
                    {
                          messageStr=@"4";
                    }
                    else if ([valueStr isEqualToString:@"32"])
                    {
                          messageStr=@"5";
                    }
                    [self.managerDelegate receiveMessageWithtype:@"2f" dataStr:messageStr];
               }
               else
               {
                    [self.managerDelegate receiveMessageWithtype:@"2f" dataStr:@"讀取頻率失敗"];
               }

          } else if ([typeStr isEqualToString:@"8d"]) {
               //停止連續盤存標籤
               NSString *strr=[dataStr substringWithRange:NSMakeRange(10, 2)];
               if ([strr isEqualToString:@"01"]) {
                    NSLog(@"停止連續盤存標籤成功");
                    self.isgetLab=NO;
                    _tagStr=[[NSMutableString alloc]init];
               }
          } else if ([typeStr isEqualToString:@"85"]) {
               //讀標籤
            // NSLog(@"RFIDBluetoothManager: 85, dataStr.length = %lu", (unsigned long)dataStr.length);
               if (dataStr.length<40) {
                    if (dataStr.length > 24) {
                         NSString *strr=[dataStr substringWithRange:NSMakeRange(18, dataStr.length-18-6)];
                         [self.managerDelegate receiveMessageWithtype:@"85" dataStr:strr];
                    } else {
                      NSLog(@"RFIDBluetoothManager: 85, possible fail: %@", dataStr);
                    }

               }
               else
               {
                    if (dataStr.length==40) {
                         NSString *aa=[dataStr substringWithRange:NSMakeRange(dataStr.length-4, 4)];
                         if ([aa isEqualToString:@"0d0a"]) {
                              NSString *strr=[dataStr substringWithRange:NSMakeRange(18, dataStr.length-18-6)];
                              [self.managerDelegate receiveMessageWithtype:@"85" dataStr:strr];
                         }
                         else
                         {
                              self.readStr=[[NSMutableString alloc]init];
                              [self.readStr appendString:dataStr];
                         }
                    } else {
                      NSLog(@"RFIDBluetoothManager: 85, possible fail: %@", dataStr);
                    }
               }

          } else if ([typeStr isEqualToString:@"87"]) {
               //寫標籤
               NSString *strr=[dataStr substringWithRange:NSMakeRange(10, 2)];
               if ([strr isEqualToString:@"01"]) {
                    [self.managerDelegate receiveMessageWithtype:@"87" dataStr:@"Successful tag writing"];
               }
               else
               {
                    [self.managerDelegate receiveMessageWithtype:@"87" dataStr:@"Failed to write tag"];
               }
          } else if ([typeStr isEqualToString:@"89"]) {
               //lock標籤
               NSString *strr=[dataStr substringWithRange:NSMakeRange(10, 2)];
               if ([strr isEqualToString:@"01"]) {
                    [self.managerDelegate receiveMessageWithtype:@"89" dataStr:@"Lock label successful"];
               }
               else
               {
                    [self.managerDelegate receiveMessageWithtype:@"89" dataStr:@"Lock label failed"];
               }
          } else if ([typeStr isEqualToString:@"8b"]) {
               //銷燬
               NSString *strr=[dataStr substringWithRange:NSMakeRange(10, 2)];
               if ([strr isEqualToString:@"01"]) {
                    [self.managerDelegate receiveMessageWithtype:@"8b" dataStr:@"Destruction of success"];
               }
               else
               {
                    [self.managerDelegate receiveMessageWithtype:@"8b" dataStr:@"Destruction of failure"];
               }
          } else if ([typeStr isEqualToString:@"81"]) {
               if (self.isSingleSaveLable) {
                    //單次盤存標籤
                    self.singleLableStr=[[NSMutableString alloc]init];
                    [self.singleLableStr appendString:dataStr];
               }
          } else if ([typeStr isEqualToString:@"71"]) {
               if (self.isSetTag) {
                    //設置標籤讀取格式
                    self.isSetTag = NO;
                    NSString *strr=[dataStr substringWithRange:NSMakeRange(10, 2)];
                    if ([strr isEqualToString:@"01"]) {
                         [self.managerDelegate receiveMessageWithtype:@"71" dataStr:@"Successful setup"];
                    }
               }
          } else if ([typeStr isEqualToString:@"73"]) {
               if (self.isGetTag) {
                    //獲取標籤讀取格式
                    self.isGetTag = NO;
                    NSString *strr=[dataStr substringWithRange:NSMakeRange(10, 2)];
                    if ([strr isEqualToString:@"01"]) {
                         NSString *epcstr=[dataStr substringWithRange:NSMakeRange(13, 1)];
                         NSString *addreStr=[BluetoothUtil becomeNumberWith:[dataStr substringWithRange:NSMakeRange(14, 2)]];
                         NSString *addreLenStr=[BluetoothUtil becomeNumberWith:[dataStr substringWithRange:NSMakeRange(16, 2)]];
                         NSString *allStr=[NSString stringWithFormat:@"%@ %@ %@",epcstr,addreStr,addreLenStr];
                         [self.managerDelegate receiveMessageWithtype:@"73" dataStr:allStr];
                    }
               }
          } else if ([typeStr isEqualToString:@"e5"]) {
               //開啓蜂鳴器
               if (self.isOpenBuzzer) {
                    NSString *strr=[dataStr substringWithRange:NSMakeRange(10, 2)];
                    if ([strr isEqualToString:@"01"]) {
                         [self.managerDelegate receiveMessageWithtype:@"e50" dataStr:@"Buzzer turned on successfully"];
                    }
                    self.isOpenBuzzer = NO;
               }

               if (self.isCloseBuzzer) {
                    NSString *strr=[dataStr substringWithRange:NSMakeRange(10, 2)];
                    if ([strr isEqualToString:@"01"]) {
                         [self.managerDelegate receiveMessageWithtype:@"e51" dataStr:@"Buzzer closed successfully"];
                    }
                    self.isCloseBuzzer = NO;
               }


               if (self.isGetBattery) {
                    //獲取電池電量
                 @try {
                   NSString *battyStr=[dataStr substringWithRange:NSMakeRange(12, 2)];
                   NSInteger n = strtoul([battyStr UTF8String], 0, 16);//16進制數據轉10進制的NSInteger
                   //NSLog(@"battyStr===%@",battyStr);
                   NSString *batStr=[NSString stringWithFormat:@"%ld",n];
                   [self.managerDelegate receiveMessageWithtype:@"e5" dataStr:batStr];
                   self.isGetBattery = NO;
                   return;
                 } @catch (NSException *exception) {
                   NSLog(@"Error on getting battery level: %@", exception);
                   [self.managerDelegate receiveMessageWithtype:@"e5" dataStr:@"-1"];
                 }
               }

               if (self.isCodeLab) {
//                    NSLog(@"掃描二維碼=%@",dataStr);
//                    NSData *rawData=[AppHelper hexToNSData:dataStr];
//                    NSData *parsedData = [self parseDataWithOriginalStr:rawData cmd:0xE5];
//
//                    if (parsedData && parsedData.length > 0) {
//                         //NSLog(@"掃描二維碼111111111111111 len=%d",parsedData.length);
//                         //NSLog(@"掃描二維碼=%@",[AppHelper dataToHex:parsedData]);
//                         Byte *bytes = (Byte *)parsedData.bytes;
//                         if (bytes[0] == 0x02) {
//                              NSString *barcode = [[NSString alloc]initWithData:parsedData encoding:NSASCIIStringEncoding];
//
//                              if (self.QRCodeSelType == selectedTypeOfUTF8) {
//                                   barcode = [[NSString alloc]initWithData:parsedData encoding:NSUTF8StringEncoding];
//                              } else if (self.QRCodeSelType == selectedTypeOfGB2312) {
//                                   NSStringEncoding enc = CFStringConvertEncodingToNSStringEncoding(kCFStringEncodingGB_18030_2000);
//                                   barcode = [[NSString alloc]initWithData:parsedData encoding:enc];
//                              }
//
//                              NSLog(@"掃描二維碼222=%@",barcode);
//                              self.isCodeLab=NO;
//                              self.rcodeStr=[[NSMutableString alloc]init];
//                              [self.managerDelegate receiveMessageWithtype:@"e55" dataStr:barcode];
//                         }
//                    }else {
//                         self.rcodeStr=[[NSMutableString alloc]init];
//                         [self.rcodeStr appendString:dataStr];
//                    }

                    //掃描二維碼
                    /*
                    if (dataStr.length<40) {

                         NSString *strr=[dataStr substringWithRange:NSMakeRange(12, dataStr.length-12-6)];
                         NSMutableString *strrr=[[NSMutableString alloc]init];
                         for(int i =1; i < [strr length]+1; i=i+2)
                         {
                              NSString *aa=[strr substringWithRange:NSMakeRange(i, 1)];
                              [strrr appendString:aa];
                         }
                         NSString *strrrr=[NSString stringWithFormat:@"%@",strrr];
                         [self.managerDelegate receiveMessageWithtype:@"e55" dataStr:strrrr];


                    }
                    else
                    {
                         if (dataStr.length==40) {
                              NSString *aa=[dataStr substringWithRange:NSMakeRange(dataStr.length-4, 4)];
                              if ([aa isEqualToString:@"0d0a"]) {

                                   NSString *strr=[dataStr substringWithRange:NSMakeRange(12, dataStr.length-12-6)];
                                   NSMutableString *strrr=[[NSMutableString alloc]init];
                                   for(int i =1; i < [strr length]+1; i=i+2)
                                   {
                                        NSString *aa=[strr substringWithRange:NSMakeRange(i, 1)];
                                        [strrr appendString:aa];
                                   }
                                   NSString *strrrr=[NSString stringWithFormat:@"%@",strrr];
                                   [self.managerDelegate receiveMessageWithtype:@"e55" dataStr:strrrr];
                                   self.isCodeLab=NO;
                              }
                              else
                              {
                                   self.rcodeStr=[[NSMutableString alloc]init];
                                   [self.rcodeStr appendString:dataStr];
                              }
                         }

                    }
                    */
               }
          } else if ([typeStr isEqualToString:@"35"]) {//獲取設備溫度
          if (self.isTemperature) {
               NSString *battyStr=[dataStr substringWithRange:NSMakeRange(12, 4)];
               NSInteger n = strtoul([battyStr UTF8String], 0, 16);//16進制數據轉10進制的NSInteger
               NSString *temStr = [NSString stringWithFormat:@"%d",n/100];
               [self.managerDelegate receiveMessageWithtype:@"35" dataStr:temStr];
               self.isTemperature = NO;
          }

          }  else if ([typeStr isEqualToString:@"21"]) {
               //  setGen2
               [self parseSetGen2DataWithData:[NSData dataWithBytes:characteristic.value.bytes length:characteristic.value.length]];
          } else if ([typeStr isEqualToString:@"23"]) {
               //  getGen2
               [self parseGetGen2DataWithData:[NSData dataWithBytes:characteristic.value.bytes length:characteristic.value.length]];
          } else if ([typeStr.uppercaseString isEqualToString:@"6F"]) {
               //  setFilter
               [self parseFilterDataWithData:[NSData dataWithBytes:characteristic.value.bytes length:characteristic.value.length]];
          } else if ([typeStr isEqualToString:@"53"]) {
               //  setRFLink
               [self parseSetRFLinkWithData:[NSData dataWithBytes:characteristic.value.bytes length:characteristic.value.length]];
          } else if ([typeStr isEqualToString:@"55"]) {
               //  getRFLink
               [self parseGetRFLinkWithData:[NSData dataWithBytes:characteristic.value.bytes length:characteristic.value.length]];
          }
     } else {

          //拿到標籤列表
          if (dataStr) {
               self.tagStr = (NSMutableString *)[self.tagStr stringByAppendingString:dataStr];
               if (!self.tagData) {
                    self.tagData = [[NSMutableData alloc]initWithData:characteristic.value];
                     //todo  NSLog(@" 新數據 self.tagData = %@ ", characteristic.value);
               } else {
                   //todo NSLog(@" 舊數據 self.tagData = %@ ", self.tagData);
                   //todo NSLog(@" 新數據 self.tagData = %@ ", characteristic.value);
                    [self.tagData appendData:characteristic.value];
               }
          }

          //       數據長度（2字節）  cmd      pc(2字節)              epc                     rssi(2字節)   ant((2字節))     crc(1字節)
          //c8 8c    00 19          e1      34 00     39 31 31 31 32 32 32 32 33 33 33 34     fe b7      01               eb          0d 0a
          if (self.tagData.length > 0) {
               Byte *tagDataBytes = (Byte *)self.tagData.bytes;
               Byte tempBytes[1024];
               int index=0;
               self.isHeader = NO;
               for(int s=0;s<self.tagData.length;s++){
                    tempBytes[index] = tagDataBytes[s];
                    index++;
                    if (!self.isHeader) {
                         if((tempBytes[0]&0xFF) != 0xC8){
                              index=0;
                         } else if(index==2 && (tempBytes[1]&0xFF) != 0x8C){
                              tempBytes[0]=tempBytes[1];
                              index=1;
                         }else{
                              if(index==5){
                                   if ((tempBytes[4]&0xFF) == 0xE1) {
                                        self.isHeader = YES;
                                   } else {
                                        //命令字不對，刪除h第一個字節數據
                                        s=s-3;
                                        index=0;
                                   }
                              }
                         }
                    } else if ((tempBytes[index - 2] & 0xFF) == 0x0D && (tempBytes[index - 1] & 0xff) == 0x0A) {

                         NSInteger len = ((tempBytes[2] & 0xFF)<<8) | (tempBytes[3]&0xFF);//數據幀h長度

                         NSData * tempNSData=[NSData dataWithBytes:tempBytes length:index];
                         //  開始解析數據
                        ////todo  NSLog(@"獲取到的正常數據爲：%@",[AppHelper dataToHex:tempNSData]);
                         NSData *tagTempData = [self parseDataWithOriginalStr:tempNSData cmd:0xE1];
                         if(tagTempData.length==0){
                           //todo  NSLog(@"解析失敗...");
                             //解析失敗繼續拼接數據幀，先不清空數據
                         }else{
                             //todo  NSLog(@"解析成功...");
                              if (self.isSupportRssi) {
                                   [self parseReadTagDataEPC_TID_USERWithData:tagTempData];
                              } else {
                                   [self parseReadTag_EPCWithDataStr:tagTempData];
                              }
                              //  解析完成，清空頭，再開始下一個數據的讀取
                              self.isHeader = NO;
                              index=0;
                         }

                    } else if (index>250){
                         //累計500個字節還沒有正確數據，直接清空緩存buff
                         index=0;
                         self.isHeader = NO;
                    }
               }

               if (index<=0) {
                    self.tagData = [NSMutableData data];
                }else{
                     //保存e未解析的h數據，和目前數據進行拼接
                     self.tagData = [NSMutableData data];
                     NSData * tempD=[NSData dataWithBytes:tempBytes length:index];
                     [self.tagData appendData:tempD];
                   //todo   NSLog(@" 保存舊數據 self.tagData = %@ ", self.tagData);
                }

          }

     }

}

- (void)parseReadTag_EPCWithDataStr:(NSData *)data {
     //NSLog(@"--===去除頭尾前的數據幀： data = %@",dataStr);
     //NSData *data = [self parseDataWithOriginalStr:dataStr cmd:0xE1];
     //NSLog(@"--===去除頭尾後的數據幀： data = %@",data);
     NSMutableArray *arr = [self parseReadTag_EPCWithData:data];
     if (arr && arr.count) {
          NSLog(@"epcDataArr = %@",arr);
          [self.managerDelegate receiveDataWithBLEDataSource:arr allCount:self.allCount countArr:self.countArr dataSource1:self.dataSource1 countArr1:self.countArr1 dataSource2:self.dataSource2 countArr2:self.countArr2];
     }
}

- (NSMutableArray *)parseReadTag_EPCWithData:(NSData *)data {
    if (data.length < 5) {
        return [NSMutableArray array];
    }

    //  //[0]-[1]:表示剩餘標籤個數  [2]:表示標籤個數  [3]:標籤長度  [4]:標籤數據開始
    Byte *dataBytes = (Byte *)data.bytes;
    int remain = ((dataBytes[0]&0xff)<<8)|(dataBytes[1]&0xff);
    int count = dataBytes[2]; // // 標籤個數
    int epcLengthIndex = 3;  // 數據長度索引
    int beginIndex = 4;  //  標籤數據開始索引
    for (NSInteger i = 0; i < count; i ++) {
        int tagLen = dataBytes[epcLengthIndex] & 0xff;  //標籤長度
        epcLengthIndex = beginIndex+tagLen; //標籤數據結束索引
        if (beginIndex+tagLen > data.length) {
            //會發生溢出，所以返回
            break;
        }
        //獲取EPC
        Byte epcDataByte[tagLen];
        [data getBytes:epcDataByte range:NSMakeRange(beginIndex, tagLen)];
        NSData *epcData = [NSData dataWithBytes:epcDataByte length:tagLen];
        NSString *epcHex=[AppHelper dataToHex:epcData];
         BOOL isHave = NO;
         for (NSInteger j = 0 ; j < self.dataSource.count; j ++) {
              NSString *oldEpcData = self.dataSource[j];
              if ([oldEpcData isEqualToString:epcHex]) {
                   isHave = YES;
                   self.allCount ++;
                   NSString *countStr=self.countArr[j];
                   [self.countArr replaceObjectAtIndex:j withObject:[NSString stringWithFormat:@"%ld",countStr.integerValue + 1]];
                   break;
              }
         }
         if (!self.dataSource || self.dataSource.count == 0 || !isHave) {
              [self.dataSource addObject:epcHex];
              [self.countArr addObject:@"1"];
         }
        beginIndex = epcLengthIndex + 1;
    }
    return self.dataSource;
}

- (void)parseReadTagDataEPC_TID_USERWithData:(NSData *)tempData {
     //NSLog(@"originalEPCTIDUSERData = %@",data);
     //NSData * tempData = [self parseDataWithOriginalStr:data cmd:0xE1];//
     //NSLog(@"去除頭尾後的EPCTIDUSERDataData = %@",tempData);
     if (tempData.length < 5) {
          //標籤數據長度小於5則直接返回，此爲無效數據。
          return;
     }
     //[0]-[1]:表示剩餘標籤個數  [2]:表示標籤個數  [3]:標籤長度  [4]:標籤數據開始

     NSString *temp=[AppHelper dataToHex:tempData];
     Byte *dataBytes = (Byte *)[tempData bytes];

     int remain=((dataBytes[0]&0xFF)<<8)|(dataBytes[1]&0xFF);
     int count = dataBytes[2] & 0xFF;// 標籤個數
     int epc_lenIndex = 3;// epc長度索引
     int epc_startIndex = 4; // 截取epc數據的起始索引
     int epc_endIndex = 0;// 截取epc數據的結束索引
     for (NSInteger k = 0; k < count; k ++) {
          epc_startIndex = epc_lenIndex + 1;
          epc_endIndex = epc_startIndex + (dataBytes[epc_lenIndex] & 0xFF);// epc的起始索引加長度得到結束索引
          if (epc_endIndex > tempData.length) {
               break;
          } else {
               Byte epcBuff[epc_endIndex - epc_startIndex];
               [tempData getBytes:epcBuff range:NSMakeRange(epc_startIndex, epc_endIndex - epc_startIndex)];
               NSData *epcDataBuff = [NSData dataWithBytes:epcBuff length:epc_endIndex - epc_startIndex];
               [self parserUhfTagBuff_EPC_TID_USER:epcDataBuff];
          }
          epc_lenIndex = epc_endIndex;
          if (epc_endIndex >= tempData.length) {
               break;
          }
     }
}

- (void)parserUhfTagBuff_EPC_TID_USER:(NSData *)tagsBuff {
     if (tagsBuff.length < 3) {
          return;
     }

     NSString * allData= [AppHelper dataToHex:tagsBuff];//整個數據
     NSInteger length = tagsBuff.length;
     NSString * pcHex= [allData substringWithRange:NSMakeRange(0, 4)];
     NSString * epcLenHex=[allData substringWithRange:NSMakeRange(0, 2)];
     int epclen = (((int)[AppHelper getHexToDecimal:(epcLenHex)])>>3) *2;
     int uiiLen = epclen + 2;
     int tidLen=12;
     int rssiLen=2;
     int antLen=1;
     // Byte pcBuff[2];
     // [tagsBuff getBytes:pcBuff range:NSMakeRange(0, 2)];
     // NSData *pcData = [NSData dataWithBytes:pcBuff length:2];
     // int epclen = ((pcBuff[0] & 0xFF)>> 3)*2;//(pc >> 3) * 2;
     //34 00     39 31 31 31 32 32 32 32 33 33 33 34     fe b7      01
     self.tagTypeStr = @"0";
     if (length >= uiiLen + 2 && epclen>0) {
          Boolean isOnlyEPC = (length < (uiiLen + rssiLen + tidLen) ? YES:NO);//只有epc
          Boolean isEPCAndTid = (length == (uiiLen + rssiLen + tidLen) ||  length ==  (uiiLen + rssiLen + tidLen + antLen) ? YES:NO);//只有epc 和 tid
          Boolean isEPCAndTidUser = (length > (uiiLen + rssiLen + tidLen + antLen) ? YES:NO);//epc + tid + user
          BOOL isHave = NO;


          if(isEPCAndTidUser == YES){
            NSLog(@"RFIDBluetoothManager: EPCAndTidUser is not supported");
//                //*************** EPC  and tid  user **************
//               self.tagTypeStr = @"2";
//               NSInteger userAndRssiLen= allData.length-(uiiLen*2+tidLen*2);
//               userAndRssiLen= (userAndRssiLen%2!=0)? userAndRssiLen-1: userAndRssiLen;//有可能數據包含一個字節的天線號，所以這裏做特殊處理
//               NSString * newUserAndRssiData= [allData substringWithRange:NSMakeRange(uiiLen*2+tidLen*2,userAndRssiLen)];
//               NSString * newUserData= [newUserAndRssiData substringWithRange:NSMakeRange(0,newUserAndRssiData.length - rssiLen*2)];
//               isHave = NO;
//               for (NSInteger j = 0 ; j < self.dataSource2.count; j ++) {
//                    NSString *oldUserAndRssiData = self.dataSource2[j];
//                    NSString *oldUser= [oldUserAndRssiData substringWithRange:NSMakeRange(0,oldUserAndRssiData.length-rssiLen*2)];
//
//                    if ([newUserData isEqualToString:oldUser]) {
//                         [self.dataSource2 replaceObjectAtIndex:j withObject:newUserAndRssiData];
//                         isHave = YES;
//                         self.allCount ++;
//                         NSString *countStr=self.countArr2[j];
//                         [self.countArr2 replaceObjectAtIndex:j withObject:[NSString stringWithFormat:@"%ld",countStr.integerValue + 1]];
//                         break;
//                    }
//               }
//               if (!self.dataSource2 || self.dataSource2.count == 0 || !isHave) {
//                    [self.dataSource2 addObject:newUserAndRssiData];
//                    [self.countArr2 addObject:@"1"];
//                    NSString * EpcData= [allData substringWithRange:NSMakeRange(4, epclen*2)];
//                    [self.countArr addObject:@"1"];
//                    [self.dataSource addObject:EpcData];
//                    NSString * TidData= [allData substringWithRange:NSMakeRange(uiiLen*2,tidLen*2 )];
//                    [self.countArr1 addObject:@"1"];
//                    [self.dataSource1 addObject:TidData];
//               }
          }else if(isEPCAndTid == YES){
            NSLog(@"RFIDBluetoothManager: EPCAndTid is not supported");
                 //*************** EPC  and tid   **************
//               self.tagTypeStr = @"1";
//               isHave = NO;
//               NSString * newTidData= [allData substringWithRange:NSMakeRange(uiiLen*2,tidLen*2 )];
//               NSString * tidAndRssiData= [allData substringWithRange:NSMakeRange(uiiLen*2, tidLen*2+rssiLen*2)];
//               for (NSInteger jTid = 0 ; jTid < self.dataSource1.count; jTid ++) {
//                    NSString *oldTid = self.dataSource1[jTid];
//                    oldTid= [oldTid substringWithRange:NSMakeRange(0,oldTid.length-rssiLen*2)];
//                    if ([oldTid isEqualToString:newTidData]) {
//                         [self.dataSource1 replaceObjectAtIndex:jTid withObject:tidAndRssiData];
//                         isHave = YES;
//                         self.allCount ++;
//                         NSString *countStr=self.countArr1[jTid];
//                         [self.countArr1 replaceObjectAtIndex:jTid withObject:[NSString stringWithFormat:@"%ld",countStr.integerValue + 1]];
//                         break;
//                    }
//               }
//               if (!self.dataSource1 || self.dataSource1.count == 0 || !isHave) {
//                    [self.dataSource1 addObject:tidAndRssiData];
//                    [self.countArr1 addObject:@"1"];
//                    NSString * EpcData= [allData substringWithRange:NSMakeRange(4, epclen*2)];
//                    [self.countArr addObject:@"1"];
//                    [self.dataSource addObject:EpcData];
//               }
          }else{
                 //*************** EPC    **************
               NSString * newEpcData= [allData substringWithRange:NSMakeRange(4, epclen*2)];
               NSString * epcAndRssiData= [allData substringWithRange:NSMakeRange(4, epclen*2+rssiLen*2)];
               NSString *rssiStr = [epcAndRssiData substringFromIndex:epcAndRssiData.length - 4];
               NSInteger numOfRssiStr = [AppHelper getDecimalByBinary:[AppHelper getBinaryByHex:rssiStr]];
               double rssi = (65535 - numOfRssiStr) / 10.0;
                // Here

//            [self playSound:1];

//               NSLog(@"-- EPC: %@, rssi: %f", newEpcData, rssi);
               [self.managerDelegate receiveScannedEpcWithRssi:newEpcData withRssi:rssi];
//               for (NSInteger j = 0 ; j < self.dataSource.count; j ++) {
//                    NSString * oldEPC = self.dataSource[j];
//                     oldEPC= [oldEPC substringWithRange:NSMakeRange(0,oldEPC.length-rssiLen*2 )];
//                    if ([oldEPC isEqualToString:newEpcData]) {
//                         isHave = YES;
//                         self.allCount ++;
//                         NSString *countStr=self.countArr[j];
//                         [self.countArr replaceObjectAtIndex:j withObject:[NSString stringWithFormat:@"%ld",countStr.integerValue + 1]];
//                         break;
//                    }
//               }
//               if (!self.dataSource || self.dataSource.count == 0 || !isHave) {
//                    [self.dataSource addObject:epcAndRssiData];
//                    [self.countArr addObject:@"1"];
//               }
          }

//          [self.managerDelegate receiveDataWithBLEDataSource:self.dataSource allCount:self.allCount countArr:self.countArr dataSource1:self.dataSource1 countArr1:self.countArr1 dataSource2:self.dataSource2 countArr2:self.countArr2];
      }
}

- (NSData *)parseDataWithOriginalStr:(NSData *)originalStr cmd:(int)cmd{
     const int R_START = 0;//開始
     const int R_5A = 1;
     const int R_LEN_H = 2;//數據長度高位
     const int R_LEN_L = 3;//數據長度低位
     const int R_CMD = 4;//命令字節
     const int R_DATA = 5;//數據
     const int R_XOR = 6;//校驗位
     const int R_END_0D = 7;//結束貞
     const int R_END_0A = 8;//結束貞
     int Head1 = 0xC8;//A5;
     int Head2 = 0x8C;//@"8C";
     int Tail1 = 0x0D;//@"0D";
     //NSString *Tail2 = @"0A";//0x0A;
     int Tail2 = 0x0A;

     int rxsta = R_START;
     int rlen = 0;//數據長度
     int ridx = 0; //數據
     int rxor = 0; //校驗字節
     int rcmd = 0; //命令字節
     int rflag = 0;//是否正確的完成了數據解析
     //NSString *dataStr = [NSString string];
     Byte rbuf[2048];
     Byte *originalByte = (Byte *)originalStr.bytes;
     for (int i = 0; i < originalStr.length; i ++) {

          int tmpdata = originalByte[i] & 0xff;
          switch (rxsta) {
               case R_START:
                    //從頭開始解析C8， 下一步開始解析5
                    if (tmpdata == Head1) {
                         rxsta = R_5A;
                    } else {
                         rxsta = R_START;
                    }
                    rxor = 0;
                    ridx = 0;
                    rlen = 0;
                    rflag = 0;
                    break;
               case R_5A:
                    //解析5A，下一步解析數據長度
                    if (tmpdata == Head2) {
                         rxsta = R_LEN_H;
                    } else {
                         rxsta = R_START;
                    }
                    break;
               case R_LEN_H:
                    //解析數據長度高字節，下一步解析數據長度低字節
                    rxor = rxor ^ tmpdata;
                    rlen = tmpdata * 256;
                    rxsta = R_LEN_L;
                    break;
               case R_LEN_L:
                    //解析數據長度低字節，下一步解析命令
                    rxor = rxor ^ tmpdata;
                    rlen = rlen + tmpdata;
                    if ((rlen < 8) || (rlen > 2048)) {
                         rxsta = R_START;
                    } else {
                         rlen = rlen - 8;
                         rxsta = R_CMD;
                    }
                    break;
               case R_CMD:
                    //解析數據長度低字節，下一步解析標籤數據
                    rxor = rxor ^ tmpdata;
                    rcmd = tmpdata;
                    if (rlen > 0) {
                         rxsta = R_DATA;
                    } else {
                         rxsta = R_XOR;
                    }
                    break;
           case R_DATA:
                    //解析標籤數據，下一步解析校驗碼
                    if (rlen == 0) {
                         rxsta = R_START;
                         break;
                    }
                    if (ridx < rlen) {
                         rxor = rxor ^ tmpdata;
                         //開始存標籤數據
                         rbuf[ridx++] = (Byte)tmpdata;
                         if (ridx >= rlen) {
                              rxsta = R_XOR;
                         }
                    }
                    break;
               case R_XOR: {
                    //解析校驗碼，下一步解析尾部0
                    if (rxor == tmpdata) {
                         rxsta = R_END_0D;
                    } else {
                         rxsta = R_START;
                    }
               }
                    break;
               case R_END_0D:
                    //解析尾部0D，下一步解析尾部0A
                    if (tmpdata == Tail1) {
                         rxsta = R_END_0A;
                    } else {
                         rxsta = R_START;
                    }
                    break;
               case R_END_0A:
                    //解析尾部0A， ,解析成功則解析完成
                    rxsta = R_START;
                    if (tmpdata == Tail2) {
                         rflag = 1;
                    }
                    break;
               default:
                    rxor = 0;
                    ridx = 0;
                    rlen = 0;
                    rflag = 0;
                    break;
          }
          if (rflag == 1) {
               break;
          }
     }

     if (rflag == 1) {
          if (rcmd != cmd) {
                    //命令不對
               return [NSData data];
          }
          //解析成功，只返回標籤數據（去掉頭尾）
          return [NSData dataWithBytes:rbuf length:ridx];
     } else {
          //解析失敗
          return [NSData data];
     }
}


#pragma mark 寫數據後回調
- (void)peripheral:(CBPeripheral *)peripheral didWriteValueForCharacteristic:(CBCharacteristic *)characteristic  error:(NSError *)error {

    if (error) {

        NSLog(@"Error writing characteristic value: %@",

              [error localizedDescription]);

        return;

    }

    NSLog(@"寫入%@成功",characteristic);

}
-(void)notifyCharacteristic:(CBPeripheral *)peripheral
             characteristic:(CBCharacteristic *)characteristic{
    [peripheral setNotifyValue:YES forCharacteristic:characteristic];

}
-(void)cancelNotifyCharacteristic:(CBPeripheral *)peripheral
                   characteristic:(CBCharacteristic *)characteristic{

    [peripheral setNotifyValue:NO forCharacteristic:characteristic];
}


- (NSString *)getVisiableIDUUID:(NSString *)peripheralIDUUID
{
    if (!peripheralIDUUID.length) {
        return @"";
    }
    peripheralIDUUID = [peripheralIDUUID stringByReplacingOccurrencesOfString:@"-" withString:@""];
    peripheralIDUUID = [peripheralIDUUID stringByReplacingOccurrencesOfString:@"<" withString:@""];
    peripheralIDUUID = [peripheralIDUUID stringByReplacingOccurrencesOfString:@">" withString:@""];
    peripheralIDUUID = [peripheralIDUUID stringByReplacingOccurrencesOfString:@" " withString:@""];
    peripheralIDUUID = [peripheralIDUUID substringFromIndex:peripheralIDUUID.length - 12];
    peripheralIDUUID = [peripheralIDUUID uppercaseString];
    NSData *bytes = [peripheralIDUUID dataUsingEncoding:NSUTF8StringEncoding];
    Byte * myByte = (Byte *)[bytes bytes];


    NSMutableString *result = [[NSMutableString alloc] initWithString:@""];
    for (int i = 5; i >= 0; i--) {
        [result appendString:[NSString stringWithFormat:@"%@",[[NSString alloc] initWithBytes:&myByte[i*2] length:2 encoding:NSUTF8StringEncoding] ]];
    }

    for (int i = 1; i < 6; i++) {
        [result insertString:@":" atIndex:3*i-1 ];
    }

    return result;
}


#pragma mark - Setter and Getter

- (CBCentralManager *)centralManager
{
    if (!_centralManager ) {
        _centralManager = [[CBCentralManager alloc] initWithDelegate:self queue:nil];
    }
    return _centralManager;
}

- (NSMutableArray *)peripheralArray
{
    if (!_peripheralArray) {
        _peripheralArray = [[NSMutableArray alloc] init];
    }
    return _peripheralArray;
}

- (CBCharacteristic *)myCharacteristic
{
    if (_myCharacteristic == nil) {
        _myCharacteristic = [CBCharacteristic new];
    }
    return _myCharacteristic;
}

- (NSString *)centralManagerStateDescribe:(CBCentralManagerState )state
{
    NSString *descStr = @"";
    switch (state) {
        case CBCentralManagerStateUnknown:

            break;
        case CBCentralManagerStatePoweredOff:
            descStr = @"請打開藍牙";
            break;
        default:
            break;
    }
    return descStr;
}

- (void)setGen2WithTarget:(char)Target action:(char)Action t:(char)T qq:(char)Q_Q startQ:(char)StartQ minQ:(char)MinQ maxQ:(char)MaxQ dd:(char)D_D cc:(char)C_C pp:(char)P_P sel:(char)Sel session:(char)Session gg:(char)G_G lf:(char)LF {
     self.isSetGen2Data = YES;
     NSData *byteData = [self setGen2DataWithTarget:Target action:Action t:T qq:Q_Q startQ:StartQ minQ:MinQ maxQ:MaxQ dd:D_D cc:C_C pp:P_P sel:Sel session:Session gg:G_G lf:LF];
     [self sendDataToBle:byteData];
}

- (NSData *)setGen2DataWithTarget:(char)Target action:(char)Action t:(char)T qq:(char)Q_Q startQ:(char)StartQ minQ:(char)MinQ maxQ:(char)MaxQ dd:(char)D_D cc:(char)C_C pp:(char)P_P sel:(char)Sel session:(char)Session gg:(char)G_G lf:(char)LF {
     Byte sbuf[4];
     sbuf[0] = (((Target & 0x07) << 5) | ((Action & 0x07) << 2) | ((T & 0x01) << 1) | ((Q_Q & 0x01) << 0));
     sbuf[1] = (((StartQ & 0x0f) << 4) | ((MinQ & 0x0f) << 0));
     sbuf[2] = (((MaxQ & 0x0f) << 4) | ((D_D & 0x01) << 3) | ((C_C & 0x03) << 1) | ((P_P & 0x01) << 0));
     sbuf[3] = (((Sel & 0x03) << 6) | ((Session & 0x03) << 4) | ((G_G & 0x01) << 3) | ((LF & 0x07) << 0));
     //return sbuf;
     NSData *sbufData = [NSData dataWithBytes:sbuf length:4];
     return [self makeSendDataWithCmd:0x20 dataBuf:sbufData];
}

- (NSData *)makeSendDataWithCmd:(int)cmd dataBuf:(NSData*)databuf {
     Byte outSendbuf[databuf.length + 8];
     int idx = 0;
     int crcValue = 0;
     outSendbuf[idx++] =  0xC8;
     outSendbuf[idx++] =  0x8C;
     outSendbuf[idx++] =  ((8 + databuf.length) / 256);
     outSendbuf[idx++] =  ((8 + databuf.length) % 256);
     outSendbuf[idx++] =  cmd;
     for (int k = 0; k < databuf.length; k++) {
          Byte *dataBufBytes = (Byte *)[databuf bytes];
          outSendbuf[idx++] = dataBufBytes[k];
     }
     for (int i = 2; i < idx; i++) {
          crcValue ^= outSendbuf[i];
     }
     outSendbuf[idx++] = crcValue;
     outSendbuf[idx++] = 0x0D;
     outSendbuf[idx++] = 0x0A;
     return [NSData dataWithBytes:outSendbuf length:databuf.length + 8];
}

- (void)getGen2SendData {
     self.isGetGen2Data = YES;
     Byte sbuf[0];
     NSData *bytesData = [self makeSendDataWithCmd:0x22 dataBuf:[NSData dataWithBytes:sbuf length:0]];
     [self sendDataToBle:bytesData];
}

- (void)parseGetGen2DataWithData:(NSData *)data {
     NSData *parsedData = [self parseDataWithOriginalStr:data cmd:0x23];
     if (parsedData && parsedData.length >= 4) {
          Byte buff[14];
          Byte *rbuf = (Byte *)[parsedData bytes];
          buff[0] = ((rbuf[0] & 0xe0) >> 5);
          buff[1] = ((rbuf[0] & 0x1c) >> 2);
          buff[2] = ((rbuf[0] & 0x02) >> 1);
          buff[3] = ((rbuf[0] & 0x01) >> 0);
          buff[4] = ((rbuf[1] & 0xf0) >> 4);
          buff[5] = (rbuf[1] & 0x0f);
          buff[6] = ((rbuf[2] & 0xf0) >> 4);
          buff[7] = ((rbuf[2] & 0x08) >> 3);
          buff[8] = ((rbuf[2] & 0x06) >> 1);
          buff[9] = (rbuf[2] & 0x01);
          buff[10] = ((rbuf[3] & 0xc0) >> 6);
          buff[11] = ((rbuf[3] & 0x30) >> 4);
          buff[12] = ((rbuf[3] & 0x08) >> 3);
          buff[13] = (rbuf[3] & 0x07);
          parsedData = [NSData dataWithBytes:buff length:14];
         }
     if (self.managerDelegate && [self.managerDelegate respondsToSelector:@selector(receiveGetGen2WithData:)]) {
          [self.managerDelegate receiveGetGen2WithData:parsedData];
     }
}

- (void)parseSetGen2DataWithData:(NSData *)data {
     BOOL parseResult = NO;
     NSData *parsedData = [self parseDataWithOriginalStr:data cmd:0x21];
     if (parsedData && parsedData.length > 0) {
          Byte *bytes = (Byte *)parsedData.bytes;
          if (bytes[0] == 0x01) {
               parseResult = YES;
          }
     }
     if (self.managerDelegate && [self.managerDelegate respondsToSelector:@selector(receiveSetGen2WithResult:)]) {
     [self.managerDelegate receiveSetGen2WithResult:parseResult];
     }
}


//----------------------------------------設置Filter--------------------------------------------------------------------------------------
- (void)setFilterWithBank:(int)bank ptr:(int)ptr cnt:(int)cnt data:(NSString *)data {
     if (data && data.length > 0) {
          if (data.length % 2 != 0) {
               data = [data stringByAppendingString:@"0"];
          }
     } else {
          data = @"00";
     }

     //NSData *fDataStr = [data dataUsingEncoding:NSUTF8StringEncoding];
     NSData *fDataStr = [BluetoothUtil hexToBytes:data];
     Byte *fData = (Byte *)[fDataStr bytes];
     const char saveflag = 0;
     Byte sbuf[1024] = {0};
     int index = 0;
     int i = 0;
     sbuf[index++] = saveflag;
     sbuf[index++] = bank;
     sbuf[index++] = (Byte)(ptr / 256);
     sbuf[index++] = (Byte)(ptr % 256);
     sbuf[index++] = (Byte)(cnt / 256);
     sbuf[index++] = (Byte)(cnt % 256);
     for (i = 0; i < (cnt / 8); i++) {
          sbuf[index++] = fData[i];
     }
     if ((cnt % 8) > 0)
          sbuf[index++] = fData[i];
     //int len=index;
     //[fDataStr getBytes:sbuf length:index];
     NSData *sendData = [NSData dataWithBytes:sbuf length:index];
     //NSData *sendData = [NSData dataWithBytes:sbuf length:index];
     NSData *ssssdata = [self makeSendDataWithCmd:0x6E dataBuf:sendData];
     [self sendDataToBle:ssssdata];
}


- (void)parseFilterDataWithData:(NSData *)data {
     BOOL parseResult = NO;
     NSData *parseData = [self parseDataWithOriginalStr:data cmd:0x6F];
     if (parseData && parseData.length > 0) {
          Byte *bytes = (Byte *)parseData.bytes;
          if (bytes[0] == 0x01) {
               parseResult = YES;
          }
     }
     if (self.managerDelegate && [self.managerDelegate respondsToSelector:@selector(receiveSetFilterWithResult:)]) {
          [self.managerDelegate receiveSetFilterWithResult:parseResult];
     }
}

- (void)setRFLinkWithMode:(int)mode {
     Byte saveFlag = 1;
     Byte sbuf[3] = {0};
     sbuf[0] = 0x00;
     sbuf[1] = saveFlag;
     sbuf[2] = (Byte)mode;
     NSData *rfLinkSetData = [NSData dataWithBytes:sbuf length:3];
     NSData *sendRFLinkData = [self makeSendDataWithCmd:0x52 dataBuf:rfLinkSetData];
     [self sendDataToBle:sendRFLinkData];
}

- (void)parseSetRFLinkWithData:(NSData *)data {
     BOOL parseResult = NO;
     NSData *parseData = [self parseDataWithOriginalStr:data cmd:0x53];
     if (parseData && parseData.length > 0) {
          Byte *parseBytes = (Byte *)[parseData bytes];
          if (parseBytes[0] == 0x01) {
               parseResult = YES;
          }
     }
     if (self.managerDelegate && [self.managerDelegate respondsToSelector:@selector(receiveSetRFLinkWithResult:)]) {
          [self.managerDelegate receiveSetRFLinkWithResult:parseResult];
     }
}

- (void)getRFLinkSendData {
     Byte sbuf[2] = {0};
     sbuf[0] = 0x00;
     sbuf[1] = 0x00;
     NSData *sendData = [NSData dataWithBytes:sbuf length:2];
     NSData *sendToBleData = [self makeSendDataWithCmd:0x54 dataBuf:sendData];
     [self sendDataToBle:sendToBleData];
}

- (void)parseGetRFLinkWithData:(NSData *)data {
     int resultData = 0;
     NSData *parseData = [self parseDataWithOriginalStr:data cmd:0x55];
     if (parseData && parseData.length >= 3) {
          Byte *bytes = (Byte *)[parseData bytes];
          if (bytes[0] == 0x01) {
               resultData = bytes[2] & 0xff;
          }
     } else {
          resultData = -1;
     }
     if (self.managerDelegate && [self.managerDelegate respondsToSelector:@selector(receiveGetRFLinkWithData:)]) {
          [self.managerDelegate receiveGetRFLinkWithData:resultData];
     }
}

- (void)dealloc
{
    [_connectTime invalidate];
    _connectTime = nil;
}

//清除緩存標籤
- (void)clearCacheTag
{
     self.dataSource=[[NSMutableArray alloc]init];
     self.dataSource1 = [NSMutableArray array];
     self.dataSource2 = [NSMutableArray array];
     _allCount=0;
     self.countArr=[[NSMutableArray alloc]init];
     self.countArr1 = [NSMutableArray array];
     self.countArr2 = [NSMutableArray array];
}
//解析單次盤點
-(void) parseSingleLabel:(NSData *)tagTempData {

     if(tagTempData && tagTempData.length>=4){
          Byte *originalByte = (Byte *)tagTempData.bytes;
          NSString *hexData=[AppHelper dataToHex:tagTempData];
          int epcLen=((originalByte[0] & 0xff)>>3)*2;
          int pcLen=2;
          int tidLen=12;
          int rssiLen=2;
          int antLen=1;
          NSInteger userLen= tagTempData.length-pcLen-epcLen-tidLen-rssiLen-antLen;
          userLen= (userLen%2!=0)? userLen-1: userLen;//有可能數據包含一個字節的天線號，所以這裏做特殊處理

          if(self.isSupportRssi==YES){
               if(tagTempData.length>pcLen+epcLen+rssiLen+antLen+tidLen){
                    //************EPC+TID+USER *************************
                    self.tagTypeStr = @"2";
                    NSString *realEPCStr = [hexData substringWithRange:NSMakeRange(4, epcLen * 2)];
                    NSString *TidStr = [hexData substringWithRange:NSMakeRange(4 + epcLen * 2, tidLen * 2)];
                    NSString *userAndRSSIStr = [hexData substringWithRange:NSMakeRange(4 + epcLen * 2+ tidLen * 2,userLen*2+rssiLen*2)];
                    NSString *newUserData= [userAndRSSIStr substringWithRange:NSMakeRange(0,userAndRSSIStr.length - rssiLen*2)];
                    BOOL isHave = NO;
                    for (NSInteger j = 0 ; j < self.dataSource2.count; j ++) {
                         NSString *oldUserAndRssiData = self.dataSource2[j];
                         NSString *oldUser= [oldUserAndRssiData substringWithRange:NSMakeRange(0,oldUserAndRssiData.length-rssiLen*2)];
                         if ([newUserData isEqualToString:oldUser]) {
                              [self.dataSource2 replaceObjectAtIndex:j withObject:userAndRSSIStr];
                              isHave = YES;
                              self.allCount ++;
                              NSString *countStr=self.countArr2[j];
                              [self.countArr2 replaceObjectAtIndex:j withObject:[NSString stringWithFormat:@"%ld",countStr.integerValue + 1]];
                              [self.countArr1 replaceObjectAtIndex:j withObject:[NSString stringWithFormat:@"%ld",countStr.integerValue + 1]];
                              [self.countArr replaceObjectAtIndex:j withObject:[NSString stringWithFormat:@"%ld",countStr.integerValue + 1]];
                              break;
                         }
                    }
                    if (!self.dataSource2 || self.dataSource2.count == 0 || !isHave) {
                         [self.dataSource2 addObject:userAndRSSIStr];
                         [self.countArr2 addObject:@"1"];
                         [self.dataSource addObject:realEPCStr];
                         [self.countArr addObject:@"1"];
                         [self.dataSource1 addObject:TidStr];
                         [self.countArr1 addObject:@"1"];
                    }
               }else if(tagTempData.length>pcLen+epcLen+rssiLen+antLen){
                    //************EPC+TID *************************
                    BOOL isHave = NO;
                    self.tagTypeStr = @"1";
                    NSString *realEPCStr = [hexData substringWithRange:NSMakeRange(4, epcLen * 2)];
                    NSString * newTidData= [hexData substringWithRange:NSMakeRange(4 + epcLen * 2,tidLen*2 )];
                    NSString * tidAndRssiData= [hexData substringWithRange:NSMakeRange(4 + epcLen * 2, tidLen*2+rssiLen*2)];
                    for (NSInteger jTid = 0 ; jTid < self.dataSource1.count; jTid ++) {
                         NSString *oldTid = self.dataSource1[jTid];
                         oldTid= [oldTid substringWithRange:NSMakeRange(0,oldTid.length-rssiLen*2)];
                         if ([oldTid isEqualToString:newTidData]) {
                              [self.dataSource1 replaceObjectAtIndex:jTid withObject:tidAndRssiData];
                              isHave = YES;
                              self.allCount ++;
                              NSString *countStr=self.countArr1[jTid];
                              [self.countArr1 replaceObjectAtIndex:jTid withObject:[NSString stringWithFormat:@"%ld",countStr.integerValue + 1]];
                              [self.countArr replaceObjectAtIndex:jTid withObject:[NSString stringWithFormat:@"%ld",countStr.integerValue + 1]];
                              break;
                         }
                    }
                    if (!self.dataSource1 || self.dataSource1.count == 0 || !isHave) {
                         [self.dataSource1 addObject:tidAndRssiData];
                         [self.countArr1 addObject:@"1"];
                         [self.dataSource addObject:realEPCStr];
                         [self.countArr addObject:@"1"];
                    }
               }else{
                    //************EPC *************************
                    self.tagTypeStr = @"0";
                    NSString *realEPCStr = [hexData substringWithRange:NSMakeRange(4, epcLen * 2)];
                    NSString *realEPCAndRssi = [hexData substringWithRange:NSMakeRange(4, epcLen * 2+rssiLen*2)];
                    BOOL isHave = NO;
                    for (NSInteger j = 0 ; j < self.dataSource.count; j ++) {
                         NSString * oldEPC = self.dataSource[j];
                         oldEPC= [oldEPC substringWithRange:NSMakeRange(0,oldEPC.length-rssiLen*2 )];

                         if ([oldEPC isEqualToString:realEPCStr]) {
                              [self.dataSource replaceObjectAtIndex:j withObject:realEPCAndRssi];
                              isHave = YES;
                              self.allCount ++;
                              NSString *countStr=self.countArr[j];
                              [self.countArr replaceObjectAtIndex:j withObject:[NSString stringWithFormat:@"%ld",countStr.integerValue + 1]];
                              break;
                         }
                    }
                    if (!self.dataSource || self.dataSource.count == 0 || !isHave) {
                         [self.dataSource addObject:realEPCAndRssi];
                         [self.countArr addObject:@"1"];
                    }
               }
          }else{
               //************EPC *************************
               self.tagTypeStr = @"0";
               NSString *realEPCStr = [hexData substringWithRange:NSMakeRange(4, epcLen * 2)];
               BOOL isHave = NO;
               for (NSInteger j = 0 ; j < self.dataSource.count; j ++) {
                    NSString * oldEPC = self.dataSource[j];
                    if ([oldEPC isEqualToString:realEPCStr]) {
                         isHave = YES;
                         self.allCount ++;
                         NSString *countStr=self.countArr[j];
                         [self.countArr replaceObjectAtIndex:j withObject:[NSString stringWithFormat:@"%ld",countStr.integerValue + 1]];
                         break;
                    }
               }
               if (!self.dataSource || self.dataSource.count == 0 || !isHave) {
                    [self.dataSource addObject:realEPCStr];
                    [self.countArr addObject:@"1"];
               }

          }

          [self.managerDelegate receiveDataWithBLEDataSource:self.dataSource allCount:self.allCount countArr:self.countArr dataSource1:self.dataSource1 countArr1:self.countArr1 dataSource2:self.dataSource2 countArr2:self.countArr2];
     }

}

- (void)initSoundIfNeeded
{
  if (self->soundInitialized) return;

  NSLog(@"RFIDBluetoothManager: initSound");
  NSString *soundFile1 = [[NSBundle mainBundle] pathForResource:@"beep" ofType:@"mp3"];
  NSError *error1;
  for (player1i = 0; player1i < SOUND_I; player1i++) {
    self->player1[player1i] = [[AVAudioPlayer alloc] initWithContentsOfURL:[NSURL fileURLWithPath:soundFile1] error:&error1];
    self->player1[player1i].numberOfLoops = 1;
  }

  NSString *soundFile2 = [[NSBundle mainBundle] pathForResource:@"beep_slight" ofType:@"mp3"];
  NSError *error2;
  for (player2i = 0; player2i < SOUND_I; player2i++) {
    self->player2[player2i] = [[AVAudioPlayer alloc] initWithContentsOfURL:[NSURL fileURLWithPath:soundFile2] error:&error2];
    self->player2[player2i].numberOfLoops = 1;
  }

  NSString *soundFile3 = [[NSBundle mainBundle] pathForResource:@"serror" ofType:@"mp3"];
  NSError *error3;
  for (player3i = 0; player3i < SOUND_I; player3i++) {
    self->player3[player3i] = [[AVAudioPlayer alloc] initWithContentsOfURL:[NSURL fileURLWithPath:soundFile3] error:&error3];
    self->player3[player3i].numberOfLoops = 1;
  }

  self->soundInitialized = YES;
}

- (void)playSound:(int)soundId withVolume:(float)volume
{
  [self initSoundIfNeeded];
//  NSLog(@"playSound: %d", soundId);
  if (soundId == 1) {
    if (self->player1i >= SOUND_I) self->player1i = 0;
    int pi = player1i;
    dispatch_async(dispatch_get_global_queue(0, 0), ^{
      @try {
        AVAudioPlayer* player = self->player1[pi >= SOUND_I ? 0 : pi];
        if (player) {
          player.volume = volume;
          [player play];
        }
      } @catch (NSException *exception) {}
    });
    self->player1i++;
  }
  if (soundId == 2) {
    if (self->player2i >= SOUND_I) self->player2i = 0;
    int pi = player2i;
    dispatch_async(dispatch_get_global_queue(0, 0), ^{
      @try {
        AVAudioPlayer* player = self->player2[pi >= SOUND_I ? 0 : pi];
        if (player) {
          player.volume = volume;
          [player play];
        }
      } @catch (NSException *exception) {}
    });
    self->player2i++;
  }
  if (soundId == 3) {
    if (self->player3i >= SOUND_I) self->player3i = 0;
    int pi = player3i;
    dispatch_async(dispatch_get_global_queue(0, 0), ^{
      @try {
        AVAudioPlayer* player = self->player3[pi >= SOUND_I ? 0 : pi];
        if (player) {
          player.volume = volume;
          [player play];
        }
      } @catch (NSException *exception) {}
    });
    self->player3i++;
  }
}

@end
