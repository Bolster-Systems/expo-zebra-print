import { NativeModule, requireNativeModule } from 'expo';

export type BluetoothPrinter = {
  id: string;
  name: string;
};

declare class ExpoZebraPrintModule extends NativeModule {
  GetPrinters(): Promise<string[]>;
  ScanForPrinters(): Promise<BluetoothPrinter[]>;
  ConnectToPrinter(id: string): Promise<boolean>;
  DoPrint(serialNumber: string, labelData: string): Promise<boolean>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoZebraPrintModule>('ExpoZebraPrint');
