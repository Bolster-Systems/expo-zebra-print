#import "ZebraPrinterWrapper.h"
#import "MfiBtPrinterConnection.h"

@implementation ZebraPrinterWrapper

+ (BOOL)printWithSerialNumber:(NSString *)serialNumber
                     labelData:(NSString *)labelData
                         error:(NSError *__autoreleasing  _Nullable *)error {

    // Instantiate connection to Zebra Bluetooth accessory
    MfiBtPrinterConnection *connection = [[MfiBtPrinterConnection alloc] initWithSerialNumber:serialNumber];

    if (!connection) {
        if (error != NULL) {
            *error = [NSError errorWithDomain:@"ZebraPrinterWrapper"
                                         code:1
                                     userInfo:@{NSLocalizedDescriptionKey: @"Failed to create printer connection"}];
        }
        return NO;
    }

    // Open the connection
    BOOL success = [connection open];

    if (!success) {
        if (error != NULL) {
            *error = [NSError errorWithDomain:@"ZebraPrinterWrapper"
                                         code:2
                                     userInfo:@{NSLocalizedDescriptionKey: @"Failed to open connection to printer"}];
        }
        return NO;
    }

    // Convert label data to NSData
    NSData *data = [labelData dataUsingEncoding:NSUTF8StringEncoding];

    if (!data) {
        [connection close];
        if (error != NULL) {
            *error = [NSError errorWithDomain:@"ZebraPrinterWrapper"
                                         code:3
                                     userInfo:@{NSLocalizedDescriptionKey: @"Failed to convert label data to bytes"}];
        }
        return NO;
    }

    // Write data to printer
    NSError *writeError = nil;
    BOOL writeSuccess = [connection write:data error:&writeError];

    // Wait for print to complete
    [NSThread sleepForTimeInterval:2.0];

    // Close the connection
    [connection close];

    if (!writeSuccess || writeError) {
        if (error != NULL) {
            *error = writeError ?: [NSError errorWithDomain:@"ZebraPrinterWrapper"
                                                       code:4
                                                   userInfo:@{NSLocalizedDescriptionKey: @"Failed to write to printer"}];
        }
        return NO;
    }

    return YES;
}

@end
