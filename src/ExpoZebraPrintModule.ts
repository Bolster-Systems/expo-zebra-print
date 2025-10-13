import { NativeModule, requireNativeModule } from 'expo';

declare class ExpoZebraPrintModule extends NativeModule {
  GetPrinters(): Promise<string[]>;
  DoPrint(serialNumber: string, labelData: string): Promise<boolean>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoZebraPrintModule>('ExpoZebraPrint');
