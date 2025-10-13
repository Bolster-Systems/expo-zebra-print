// Reexport the native module. On web, it will be resolved to ExpoZebraPrintModule.web.ts
// and on native platforms to ExpoZebraPrintModule.ts
export { default } from './ExpoZebraPrintModule';
export { default as ExpoZebraPrintView } from './ExpoZebraPrintView';
export * from  './ExpoZebraPrint.types';
