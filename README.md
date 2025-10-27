# Installation Instructions

## 1. Install the package

```bash
npm install expo-zebra-print
# or
yarn add expo-zebra-print
```

## 2. Add the plugin to your app.json

```json
{
  "expo": {
    "plugins": ["expo-zebra-print"]
  }
}
```

## 3. Add Zebra SDK linking to your Podfile

Open `ios/Podfile` and add this code inside the `post_install` hook (after the `react_native_post_install` call):

```ruby
post_install do |installer|
  react_native_post_install(
    installer,
    config[:reactNativePath],
    :mac_catalyst_enabled => false,
    :ccache_enabled => ccache_enabled?(podfile_properties),
  )

  # ===== ADD THIS SECTION =====
  # Configure Zebra SDK linking for the app target
  zebra_sdk_path = File.expand_path('../node_modules/expo-zebra-print/ios/ZSDK_API.xcframework', __dir__)

  # Find the user project
  user_project = installer.aggregate_targets.first.user_project

  # Configure the app target
  user_project.native_targets.each do |target|
    if target.name == 'YourAppName'  # Replace with your actual app name
      puts "[Zebra SDK] Configuring #{target.name} with Zebra SDK"

      target.build_configurations.each do |config|
        # Add -force_load flags for simulator and device
        config.build_settings['OTHER_LDFLAGS[sdk=iphonesimulator*]'] ||= '$(inherited)'
        config.build_settings['OTHER_LDFLAGS[sdk=iphonesimulator*]'] += ' -force_load "' + zebra_sdk_path + '/ios-arm64_x86_64-simulator/ZSDK_API.a"'

        config.build_settings['OTHER_LDFLAGS[sdk=iphoneos*]'] ||= '$(inherited)'
        config.build_settings['OTHER_LDFLAGS[sdk=iphoneos*]'] += ' -force_load "' + zebra_sdk_path + '/ios-arm64/ZSDK_API.a"'

        puts "[Zebra SDK] Configured #{config.name}"
      end

      user_project.save
    end
  end
  # ===== END SECTION =====
end
```

**Important:** Replace `'YourAppName'` with your actual app target name (usually lowercase version of your app name).

## 4. Install pods and build

```bash
cd ios
pod install
cd ..
npx expo run:ios
```

