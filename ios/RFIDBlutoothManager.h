//
//  RFIDBlutoothManager.h
//  RFID_ios
//
//  Created by chainway on 2018/4/26.
//  Copyright © 2018年 chainway. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <CoreBluetooth/CoreBluetooth.h>
#import <AudioToolbox/AudioToolbox.h>
#import <AVFoundation/AVFoundation.h>
#import "BLEModel.h"
#import "BluetoothUtil.h"

#define SOUND_I 24

@protocol FatScaleBluetoothManager <NSObject>

@optional
//藍牙鏈接失敗
- (void)connectBluetoothFailWithMessage:(NSString *)msg;
//藍牙連接超時
- (void)connectBluetoothTimeout;
//鏈接到數據
- (void)receiveDataWith:(id)parseModel dataSource:(NSMutableArray *)dataSource;
//列表數據
- (void)receiveDataWithBLEmodel:(BLEModel *)model result:(NSString *)result;
//首頁標籤數據
- (void)receiveScannedEpcWithRssi:(NSString *)epc withRssi:(double)rssi;
- (void)receiveDataWithBLEDataSource:(NSMutableArray *)dataSource allCount:(NSInteger)allCount countArr:(NSMutableArray *)countArr dataSource1:(NSMutableArray *)dataSource1 countArr1:(NSMutableArray *)countArr1 dataSource2:(NSMutableArray *)dataSource2 countArr2:(NSMutableArray *)countArr2;

- (void)receiveDataWithBLEDataSource:(NSMutableArray *)dataSourceEPC dataSourceTID:(NSMutableArray *)dataSourceTID dataSourceUSER:(NSMutableArray *)dataSourceUSER RSSI:(NSInteger)RSSI ;


//首頁標籤數據
- (void)receiveRcodeDataWithBLEDataSource:(NSMutableArray *)dataSource;
//
- (void)receiveMessageWithtype:(NSString *)typeStr dataStr:(NSString *)dataStr;
//連接外設成功
- (void)connectPeripheralSuccess:(CBPeripheral *)peripheral;
//斷開外設
-(void)disConnectPeripheral;
//更改藍牙設備名稱成功
- (void)updateBLENameSuccess;
//  設置Gen2是否成功
- (void)receiveSetGen2WithResult:(BOOL)result;
//  獲取Gen2
- (void)receiveGetGen2WithData:(NSData *)resultData;
//  設置Filter是否成功
- (void)receiveSetFilterWithResult:(BOOL)result;
//  設置RFLink
- (void)receiveSetRFLinkWithResult:(BOOL)result;
//  獲取RFLink
- (void)receiveGetRFLinkWithData:(int)data;

@end
@protocol PeripheralAddDelegate <NSObject>

@optional

- (void)addPeripheralWithPeripheral:(BLEModel *)peripheralModel;

@end


@interface RFIDBlutoothManager : NSObject {
  BOOL soundInitialized;
  AVAudioPlayer* player1[SOUND_I];
  AVAudioPlayer* player2[SOUND_I];
  AVAudioPlayer* player3[SOUND_I];
  int player1i;
  int player2i;
  int player3i;
}

@property (nonatomic, strong) CBCentralManager *centralManager;
@property (nonatomic, assign) BOOL connectDevice;

+ (instancetype)shareManager;


@property (nonatomic,strong)NSMutableArray *dataSource;

@property (nonatomic,strong)NSMutableArray *countArr;

@property (nonatomic,strong)NSMutableArray *dataSource1;

@property (nonatomic,strong)NSMutableArray *countArr1;

@property (nonatomic,strong)NSMutableArray *dataSource2;

@property (nonatomic,strong)NSMutableArray *countArr2;
/** qrcodeSelType */
// @property (assign,nonatomic) selectedType QRCodeSelType;





@property (nonatomic, assign) NSInteger allCount;

@property (nonatomic, assign) int num;

@property (nonatomic,assign)BOOL isgetLab;//是否是獲取標籤

@property (nonatomic,assign)BOOL isSupportRssi;//是否是獲取升級後的標籤

@property (nonatomic,assign)BOOL isBLE40;//藍牙4.0

@property (nonatomic,assign)BOOL isGetVerson;//是否是獲取版本號

@property (nonatomic,assign)BOOL isGetBattery;//是否是獲取電量

@property (nonatomic,assign)BOOL isCodeLab; //掃描二維碼

@property (nonatomic,assign)BOOL isTemperature; //獲取溫度

@property (nonatomic,assign)BOOL isSetEmissionPower; //發射功率

@property (nonatomic,assign)BOOL isGetEmissionPower; //獲取發射功率

@property (nonatomic,assign)BOOL isOpenBuzzer; //開啓蜂鳴器

@property (nonatomic,assign)BOOL isCloseBuzzer; //關閉蜂鳴器

@property (nonatomic,assign)BOOL isSingleSaveLable; //單次盤點標籤

@property (nonatomic,assign)BOOL isSetTag; //設置讀取標籤格式
@property (nonatomic,assign)BOOL isGetTag; //獲取讀取標籤格式

/** isSetNewLabEPC */
@property (assign,nonatomic) BOOL isReadNewLabEPC;
/** isSetNewLabEPC+TID */
@property (assign,nonatomic) BOOL isReadNewLabEPCANDTID;
/** isSetNewLabEPC+TID+USER*/
@property (assign,nonatomic) BOOL isReadNewLabEPCANDTIDANDUSER;


@property (nonatomic,assign)BOOL isRegion;

///////////// NLAB -----   2021/3/15

/** isSetGen2Data */
@property (assign,nonatomic) BOOL isSetGen2Data;
/** isGetGen2Data */
@property (assign,nonatomic) BOOL isGetGen2Data;

/////////////
@property (nonatomic, strong) NSMutableData *byteData;
@property (nonatomic,strong)NSMutableString *tagStr;
/** tagData */
@property (nonatomic, strong) NSMutableData *tagData;

@property (nonatomic,copy)NSString *tagTypeStr;//判斷連續獲取新標籤的時候返回的類型是epc還是epc+tid還是epc+tid+user

@property (nonatomic,copy)NSString *typeStr;

@property (nonatomic,strong)NSMutableString *getMiStr;//獲取的SM4密碼

@property (nonatomic,strong)NSMutableString *encryStr;//SM4加密

@property (nonatomic,strong)NSMutableString *dencryStr;//SM4解密

@property (nonatomic,strong)NSMutableString *USERStr;//USER解密

@property (nonatomic,strong)NSMutableString *readStr;//讀數據

@property (nonatomic,strong)NSMutableString *rcodeStr;//二維碼數據

@property (nonatomic,strong)NSMutableString *singleLableStr;//單次標籤數據

@property (nonatomic,strong)NSMutableString *rcodeDataSource;//二維碼數據數組






- (void)startBleScan;                // 開啓藍牙掃描
- (void)stopBleScan;
- (void)cancelConnectBLE;             //斷開連接
- (void)closeBleAndDisconnect;       // 停止藍牙掃描&斷開


-(void)getFirmwareVersion2;//獲取固件版本號
-(void)getBatteryLevel;//獲取電池電量
-(void)getServiceTemperature;//獲取設備當前溫度
-(void)start2DScan;//開啓2D掃描
-(void)getHardwareVersion;//獲取硬件版本號
-(void)getFirmwareVersion;//獲取固件版本號
-(void)getServiceID;//獲取設備ID
-(void)softwareReset;//軟件復位
-(void)setOpenBuzzer;//開啓蜂鳴器
-(void)setCloseBuzzer;//關閉蜂鳴器


-(void)setEpcTidUserWithAddressStr:(NSString *)addressStr length:(NSString *)lengthStr epcStr:(NSString *)epcStr;//設置標籤讀取格式
-(void)getEpcTidUser;//獲取標籤讀取格式

-(void)setLaunchPowerWithstatus:(NSString *)status antenna:(NSString *)antenna readStr:(NSString *)readStr writeStr:(NSString *)writeStr;//設置發射功率
-(void)getLaunchPower;//獲取當前發射功率
-(void)detailChancelSettingWithstring:(NSString *)str;//跳頻設置
-(void)getdetailChancelStatus;//獲取當前跳頻設置狀態


-(void)setRegionWithsaveStr:(NSString *)saveStr regionStr:(NSString *)regionStr;//區域設置
-(void)getRegion;//獲取區域設置

-(void)singleSaveLabel;//單次盤存標籤

-(void)continuitySaveLabelWithCount:(NSString *)count;//連續盤存標籤
-(void)stopContinuitySaveLabel;//停止連續盤存標籤

//password:4個字節的訪問密碼.  MMBstr:掩碼的數據區(0x00爲Reserve 0x01爲EPC，0x02表示TID，0x03表示USR). MSAstr:爲掩碼的地址。 MDLstr:爲掩碼的長度。 Mdata:爲掩碼數據。 MBstr:爲要寫的數據區(0x00爲Reserve 0x01爲EPC，0x02表示TID，0x03表示USR)  SAstr :爲要寫數據區的地址。 DLstr :爲要寫的數據長度(字爲單位)。 isfilter表示是否過濾
-(void)readLabelMessageWithPassword:(NSString *)password MMBstr:(NSString *)MMBstr MSAstr:(NSString *)MSAstr MDLstr:(NSString *)MDLstr MDdata:(NSString *)MDdata MBstr:(NSString *)MBstr SAstr:(NSString *)SAstr DLstr:(NSString *)DLstr isfilter:(BOOL)isfilter;//讀標籤數據區   成功

//password:4個字節的訪問密碼.  MMBstr:掩碼的數據區(0x00爲Reserve 0x01爲EPC，0x02表示TID，0x03表示USR). MSAstr:爲掩碼的地址。 MDLstr:爲掩碼的長度。 Mdata:爲掩碼數據。 MBstr:爲要寫的數據區(0x00爲Reserve 0x01爲EPC，0x02表示TID，0x03表示USR)  SAstr :爲要寫數據區的地址。 DLstr :爲要寫的數據長度(字爲單位)。 writeData :爲寫入的數據，高位在前。 isfilter表示是否過濾
-(void)writeLabelMessageWithPassword:(NSString *)password MMBstr:(NSString *)MMBstr MSAstr:(NSString *)MSAstr MDLstr:(NSString *)MDLstr MDdata:(NSString *)MDdata MBstr:(NSString *)MBstr SAstr:(NSString *)SAstr DLstr:(NSString *)DLstr writeData:(NSString *)writeData isfilter:(BOOL)isfilter;//寫標籤數據區   成功

//AP 爲標籤的 AccPwd 值;MMB 爲啓動過濾操作的 bank 號，0x01 表 示 EPC，0x02 表示 TID，0x03 表示 USR，其他值爲非法值;MSA 爲啓動過濾 操作的起始地址，單位爲 bit;MDL爲啓動過濾操作的過濾數據長度，單位爲 bit，0x00 表示無過濾;MData 爲啓動過濾時的數據，單位爲字節，若 MDL 不足整數 倍字節，不足位低位補 0;LD 共 3 個字節 24bit，其中，高 4bit 無效，第 0~9bit(共10bit)爲 Action 位，第 10~19bit(共 10bit)爲 mask 位 isfilter表示是否過濾
-(void)lockLabelWithPassword:(NSString *)password MMBstr:(NSString *)MMBstr MSAstr:(NSString *)MSAstr MDLstr:(NSString *)MDLstr MDdata:(NSString *)MDdata ldStr:(NSString *)ldStr isfilter:(BOOL)isfilter;//Lock標籤

//KP 爲標籤的 KillPwd 值;MMB 爲啓動過濾操作的 bank 號，0x01 表 示 EPC，0x02 表示 TID，0x03 表示 USR，其他值爲非法值;MSA 爲啓動過濾 操作的起始地址，單位爲 bit;MDL爲啓動過濾操作的過濾數據長度，單位爲 bit， 0x00 表示無過濾;MData 爲啓動過濾時的數據，單位爲字節，若 MDL 不足整數 倍字節，不足位低位補 0;當標籤的 KillPwd 區的值爲 0x00000000 時，標籤會忽 略 kill 命令，kill 命令不會成功 isfilter表示是否過濾
-(void)killLabelWithPassword:(NSString *)password MMBstr:(NSString *)MMBstr MSAstr:(NSString *)MSAstr MDLstr:(NSString *)MDLstr MDdata:(NSString *)MDdata isfilter:(BOOL)isfilter;//kill標籤

-(void)getLabMessage;//獲取標籤數據 可以
-(void)setSM4PassWordWithmodel:(NSString *)model password:(NSString *)password originPass:(NSString *)originPass;//設置密鑰   可以
-(void)getSM4PassWord;//獲取密鑰 可以

-(void)encryptionPassWordwithmessage:(NSString *)message;//SM4數據加密  可以
-(void)decryptPassWordwithmessage:(NSString *)message;//SM4數據解密  可以

-(void)encryptionUSERWithaddress:(NSString *)address lengthStr:(NSString *)lengthStr dataStr:(NSString *)dataStr;//USER加密  可以
-(void)decryptUSERWithaddress:(NSString *)address lengthStr:(NSString *)lengthStr;//USER解密 可以


-(void)enterUpgradeMode;//進入升級模式
-(void)enterUpgradeAcceptData;//進入升級接收數據
-(void)enterUpgradeSendtDataWith:(NSString *)dataStr;//進入升級發送數據
-(void)sendtUpgradeDataWith:(NSData *)dataStr;//發送升級數據

-(void)exitUpgradeMode;//退出升級模式


- (void)setFatScaleBluetoothDelegate:(id<FatScaleBluetoothManager>)delegate;
- (void)setPeripheralAddDelegate:(id<PeripheralAddDelegate>)delegate;
- (void)bleDoScan;
- (void)connectPeripheral:(CBPeripheral *)peripheral macAddress:(NSString *)macAddress;
- (BOOL)connectPeripheralWithIdentifier:(NSString *)identifier;

- (Byte )getBye8:(Byte[])data;
- (void)sendDataToBle:(NSData *)data;

- (void)setGen2WithTarget:(char)Target action:(char)Action t:(char)T qq:(char)Q_Q startQ:(char)StartQ minQ:(char)MinQ maxQ:(char)MaxQ dd:(char)D_D cc:(char)C_C pp:(char)P_P sel:(char)Sel session:(char)Session gg:(char)G_G lf:(char)LF;
- (void)getGen2SendData;

- (void)setFilterWithBank:(int)bank ptr:(int)ptr cnt:(int)cnt data:(NSString *)data;

- (void)setRFLinkWithMode:(int)mode;
- (void)getRFLinkSendData;
- (void)clearCacheTag;
- (void)parseKeyDown:(NSData *) data;
//- (NSData *)setFilterSendDataWithUfBank:(char)ufBank ufPtr:(int)ufPtr dataLen:(int)datalen hexDataBuf:(NSString *)hexDatabuf;

- (void)initSoundIfNeeded;
- (void)playSound:(int)soundId;

@end
