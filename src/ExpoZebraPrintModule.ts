import { NativeModule, requireNativeModule } from 'expo';

import { ExpoZebraPrintModuleEvents } from './ExpoZebraPrint.types';

declare class ExpoZebraPrintModule extends NativeModule<ExpoZebraPrintModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoZebraPrintModule>('ExpoZebraPrint');
