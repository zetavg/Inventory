//
//  AppHelper.h
//  RFID_ios
//
//  Created by 張炳磊 on 2019/9/29.
//  Copyright © 2019 chainway. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface AppHelper : NSObject

/**
 二進制轉換爲十進制

 @param binary 二進制數
 @return 十進制數
 */
+ (NSInteger)getDecimalByBinary:(NSString *)binary;

/**
 十進制轉化爲二進制

 @param decimal 十進制的數據
 @return 二進制的結果
 */
+ (NSString *)getBinaryByDecimal:(NSInteger)decimal;


/**
 十進制轉換十六進制

 @param decimal 十進制數
 @return 十六進制數
 */
+ (NSString *)getHexByDecimal:(NSInteger)decimal;

/**
 十六進制轉換爲二進制

 @param hex 十六進制數
 @return 二進制數
 */
+ (NSString *)getBinaryByHex:(NSString *)hex;

/**
 二進制轉換成十六進制

 @param binary 二進制數
 @return 十六進制數
 */
+ (NSString *)getHexByBinary:(NSString *)binary;

/**
 十六進制轉十進制

 @param hex 十六進制數
 @return 十進制數
 */
+ (UInt64)getHexToDecimal:(NSString *)hex;

/**
 十六進制轉NSData

 @param hex 十六進制數
 @return 十進制數
 */
+ (NSData *)hexToNSData:(NSString *)hex;

/**
 NSData轉十六進制數

 @param hex 十六進制數
 @return 十進制數
 */
+(NSString *)dataToHex:(NSData *)data ;
@end

NS_ASSUME_NONNULL_END
