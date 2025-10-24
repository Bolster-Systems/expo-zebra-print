import { NativeModule, requireNativeModule } from 'expo';

export type BluetoothPrinter = {
  id: string;
  name: string;
};

export type PermissionResponse = {
  granted: boolean;
  canAskAgain: boolean;
};

declare class ExpoZebraPrintModule extends NativeModule {
  RequestPermissions(): Promise<PermissionResponse>;
  GetPrinters(): Promise<string[]>;
  ScanForPrinters(): Promise<BluetoothPrinter[]>;
  ConnectToPrinter(id: string): Promise<boolean>;
  DoPrint(serialNumber: string, labelData: string): Promise<boolean>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoZebraPrintModule>('ExpoZebraPrint');
