//
//  BluetoothUtil.h
//  RFID_ios
//
//  Created by chainway on 2018/4/26.
//  Copyright © 2018年 chainway. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface BluetoothUtil : NSObject

@property (nonatomic,copy)NSString *typeStr;

+ (instancetype)shareManager;

//  二進制轉十進制
+ (NSString *)toDecimalWithBinary:(NSString *)binary;

// 16進制String和2進制String互轉
+ (NSString *)getBinaryByhex:(NSString *)hex binary:(NSString *)binary;

// 普通字符轉16進制
+ (NSString *)hexStringFromString:(NSString *)string;

// 十六進制轉換爲普通字符串的
+ (NSString *)stringFromHexString:(NSString *)hexString;

// nsdata轉成16進制字符串
+ (NSString*)stringWithHexBytes2:(NSData *)sender;

// 將16進制數據轉化成NSData
+ (NSData*) hexToBytes:(NSString *)string;

// 數字轉十六進制字符串
- (NSString *)stringWithHexNumber:(NSUInteger)hexNumber;

// 十進制轉二進制
+ (NSString *)toBinarySystemWithDecimalSystem:(NSInteger)decimal;

// 二進制轉十進制
+ (NSString *)toDecimalSystemWithBinarySystem:(NSString *)binary;

+(NSString *)getTimeStringWithTimeData:(NSInteger)timeData;

+(NSMutableArray *)getSixteenNumberWith:(NSString *)str;

+(NSString *)becomeNumberWith:(NSString *)str;

+(NSInteger )getzhengshuWith:(NSString *)str;

+(NSString *)getTagCountWith:(NSString *)str;

// 解析標籤
+(NSMutableArray *)getLabTagWith:(NSString *)tagStr dataSource:(NSMutableArray *)dataSource countArr:(NSMutableArray *)countArr;

// 解析標籤2
+(NSMutableArray *)getNewLabTagWith:(NSString *)tagStr dataSource:(NSMutableArray *)dataSource countArr:(NSMutableArray *)countArr dataSource1:(NSMutableArray *)dataSource1 countArr1:(NSMutableArray *)countArr1 dataSource2:(NSMutableArray *)dataSource2 countArr2:(NSMutableArray *)countArr2;

// 獲取固件版本號
+(NSData *)getFirmwareVersion2;
// 獲取電池電量
+(NSData *)getBatteryLevel;
// 獲取設備當前溫度
+(NSData *)getServiceTemperature;
// 開啓2D掃描
+(NSData *)start2DScan;
// 獲取硬件版本號
+(NSData *)getHardwareVersion;
// 獲取固件版本號
+(NSData *)getFirmwareVersion;
// 獲取設備ID
+(NSData *)getServiceID;
// 軟件復位
+(NSData *)softwareReset;
// 開啓蜂鳴器
+(NSData *)openBuzzer;
// 關閉蜂鳴器
+(NSData *)closeBuzzer;
// 設置標籤讀取格式
+(NSData *)setEpcTidUserWithAddressStr:(NSString *)addressStr length:(NSString *)lengthStr EPCStr:(NSString *)ePCStr;
// 獲取標籤讀取格式
+(NSData *)getEpcTidUser;

// 設置發射功率
+(NSData *)setLaunchPowerWithstatus:(NSString *)status antenna:(NSString *)antenna readStr:(NSString *)readStr writeStr:(NSString *)writeStr;
// 獲取當前發射功率
+(NSData *)getLaunchPower;
// 跳頻設置
+(NSData *)detailChancelSettingWithstring:(NSString *)str;
// 獲取當前跳頻設置狀態
+(NSData *)getdetailChancelStatus;
// 區域設置
+(NSData *)setRegionWithsaveStr:(NSString *)saveStr regionStr:(NSString *)regionStr;
// 獲取區域設置
+(NSData *)getRegion;
// 單次盤存標籤
+(NSData *)singleSaveLabel;
// 連續盤存標籤
+(NSData *)continuitySaveLabelWithCount:(NSString *)count;
// 停止連續盤存標籤
+(NSData *)StopcontinuitySaveLabel;
// 讀標籤數據區
+(NSData *)readLabelMessageWithPassword:(NSString *)password MMBstr:(NSString *)MMBstr MSAstr:(NSString *)MSAstr MDLstr:(NSString *)MDLstr MDdata:(NSString *)MDdata MBstr:(NSString *)MBstr SAstr:(NSString *)SAstr DLstr:(NSString *)DLstr isfilter:(BOOL)isfilter;
// 寫標籤數據區
+(NSData *)writeLabelMessageWithPassword:(NSString *)password MMBstr:(NSString *)MMBstr MSAstr:(NSString *)MSAstr MDLstr:(NSString *)MDLstr MDdata:(NSString *)MDdata MBstr:(NSString *)MBstr SAstr:(NSString *)SAstr DLstr:(NSString *)DLstr writeData:(NSString *)writeData isfilter:(BOOL)isfilter;
// kill標籤
+(NSData *)killLabelWithPassword:(NSString *)password MMBstr:(NSString *)MMBstr MSAstr:(NSString *)MSAstr MDLstr:(NSString *)MDLstr MDdata:(NSString *)MDdata isfilter:(BOOL)isfilter;
// Lock標籤
+(NSData *)lockLabelWithPassword:(NSString *)password MMBstr:(NSString *)MMBstr MSAstr:(NSString *)MSAstr MDLstr:(NSString *)MDLstr MDdata:(NSString *)MDdata ldStr:(NSString *)ldStr isfilter:(BOOL)isfilter;
// 獲取標籤數據
+(NSData *)getLabMessage;
// 設置密鑰
+(NSData *)setSM4PassWordWithmodel:(NSString *)model password:(NSString *)password originPass:(NSString *)originPass;
// 獲取密鑰
+(NSData *)getSM4PassWord;
// SM4數據加密
+(NSData *)encryptionPassWordwithmessage:(NSString *)message;
// SM4數據解密
+(NSData *)decryptPassWordwithmessage:(NSString *)message;
// USER加密
+(NSData *)encryptionUSERWithaddress:(NSString *)address lengthStr:(NSString *)lengthStr dataStr:(NSString *)dataStr;
// USER解密
+(NSData *)decryptUSERWithaddress:(NSString *)address lengthStr:(NSString *)lengthStr;



// 進入升級模式
+(NSData *)enterUpgradeMode;
// 進入升級接收數據
+(NSData *)enterUpgradeAcceptData;
// 進入升級發送數據
+(NSData *)enterUpgradeSendtDataWith:(NSString *)dataStr;
// 發送升級數據
+(NSData *)sendtUpgradeDataWith:(NSData *)dataStr;
// 退出升級模式
+(NSData *)exitUpgradeMode;

///////////   NLAB------ 2021/3/15

+(NSData *)setGen2;
+(NSData *)getGen2;




@end
