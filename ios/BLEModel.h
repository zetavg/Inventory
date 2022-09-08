//
//  BLEModel.h
//  RFID_ios
//
//  Created by chainway on 2018/4/26.
//  Copyright © 2018年 chainway. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <CoreBluetooth/CoreBluetooth.h>
@interface BLEModel : NSObject

@property (nonatomic,copy)NSString *nameStr;
@property (nonatomic,copy)NSString *addressStr;
@property (nonatomic,copy)NSString *rssStr;
@property (nonatomic,strong)CBPeripheral *peripheral;


@end
