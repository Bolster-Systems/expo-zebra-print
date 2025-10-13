import { registerWebModule, NativeModule } from 'expo';

import { ExpoZebraPrintModuleEvents } from './ExpoZebraPrint.types';

class ExpoZebraPrintModule extends NativeModule<ExpoZebraPrintModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
}

export default registerWebModule(ExpoZebraPrintModule, 'ExpoZebraPrintModule');
