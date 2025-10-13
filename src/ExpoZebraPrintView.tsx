import { requireNativeView } from 'expo';
import * as React from 'react';

import { ExpoZebraPrintViewProps } from './ExpoZebraPrint.types';

const NativeView: React.ComponentType<ExpoZebraPrintViewProps> =
  requireNativeView('ExpoZebraPrint');

export default function ExpoZebraPrintView(props: ExpoZebraPrintViewProps) {
  return <NativeView {...props} />;
}
