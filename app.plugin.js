const { withInfoPlist, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Add UISupportedExternalAccessoryProtocols to Info.plist for Zebra printer support
 */
const withZebraPrint = (config) => {
  config = withInfoPlist(config, (config) => {
    const protocols = config.modResults.UISupportedExternalAccessoryProtocols || [];

    // Add com.zebra.rawport if not already present
    if (!protocols.includes('com.zebra.rawport')) {
      protocols.push('com.zebra.rawport');
    }

    config.modResults.UISupportedExternalAccessoryProtocols = protocols;

    return config;
  });

  // Add Podfile post_install hook for Zebra SDK linking
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let podfileContent = fs.readFileSync(podfilePath, 'utf-8');

      // Check if Zebra SDK configuration already exists
      if (!podfileContent.includes('[Zebra SDK]')) {
        // Find the post_install block
        const postInstallRegex = /(post_install do \|installer\|[\s\S]*?)(^\s*end\s*$)/m;
        const match = podfileContent.match(postInstallRegex);

        if (match) {
          const zebraConfig = `
    # Configure Zebra SDK linking for the app target
    zebra_sdk_path = File.expand_path('../../node_modules/expo-zebra-print/ios/ZSDK_API.xcframework', __dir__)

    # Find the user project
    user_project = installer.aggregate_targets.first.user_project

    # Iterate through all native targets in the user project
    configured = false
    user_project.native_targets.each do |target|
      if target.name == '${config.modRequest.projectName || config.name}' && !configured
        # Check if already configured
        first_config = target.build_configurations.first
        if first_config && first_config.build_settings['OTHER_LDFLAGS[sdk=iphonesimulator*]'].to_s.include?('ZSDK_API.a')
          puts "[Zebra SDK] Already configured, skipping"
          next
        end

        puts "[Zebra SDK] Configuring #{target.name} with Zebra SDK"

        target.build_configurations.each do |build_config|
          # Add the Zebra SDK static library based on the SDK
          sim_flags = build_config.build_settings['OTHER_LDFLAGS[sdk=iphonesimulator*]'] || '$(inherited)'
          build_config.build_settings['OTHER_LDFLAGS[sdk=iphonesimulator*]'] = sim_flags.to_s + ' -force_load "' + zebra_sdk_path + '/ios-arm64_x86_64-simulator/ZSDK_API.a"'

          device_flags = build_config.build_settings['OTHER_LDFLAGS[sdk=iphoneos*]'] || '$(inherited)'
          build_config.build_settings['OTHER_LDFLAGS[sdk=iphoneos*]'] = device_flags.to_s + ' -force_load "' + zebra_sdk_path + '/ios-arm64/ZSDK_API.a"'

          # Add header search paths
          header_paths = build_config.build_settings['HEADER_SEARCH_PATHS'] || '$(inherited)'
          build_config.build_settings['HEADER_SEARCH_PATHS'] = header_paths.to_s + ' "' + zebra_sdk_path + '/ios-arm64/Headers" "' + zebra_sdk_path + '/ios-arm64_x86_64-simulator/Headers"'

          puts "[Zebra SDK] Configured #{build_config.name} build settings"
        end

        user_project.save
        configured = true
      end
    end
`;

          // Insert before the end of post_install
          podfileContent = podfileContent.replace(
            postInstallRegex,
            `$1${zebraConfig}$2`
          );

          fs.writeFileSync(podfilePath, podfileContent);
        }
      }

      return config;
    },
  ]);

  return config;
};

module.exports = withZebraPrint;
