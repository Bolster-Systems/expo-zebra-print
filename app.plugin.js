const { withInfoPlist } = require('@expo/config-plugins');

/**
 * Add UISupportedExternalAccessoryProtocols to Info.plist for Zebra printer support
 */
const withZebraPrint = (config) => {
  return withInfoPlist(config, (config) => {
    const protocols = config.modResults.UISupportedExternalAccessoryProtocols || [];

    // Add com.zebra.rawport if not already present
    if (!protocols.includes('com.zebra.rawport')) {
      protocols.push('com.zebra.rawport');
    }

    config.modResults.UISupportedExternalAccessoryProtocols = protocols;

    return config;
  });
};

module.exports = withZebraPrint;
