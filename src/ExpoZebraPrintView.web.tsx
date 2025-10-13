import * as React from 'react';

import { ExpoZebraPrintViewProps } from './ExpoZebraPrint.types';

export default function ExpoZebraPrintView(props: ExpoZebraPrintViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
