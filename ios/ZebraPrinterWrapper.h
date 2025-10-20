#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface ZebraPrinterWrapper : NSObject

+ (BOOL)printWithSerialNumber:(NSString *)serialNumber
                     labelData:(NSString *)labelData
                         error:(NSError *_Nullable *_Nullable)error;

@end

NS_ASSUME_NONNULL_END
