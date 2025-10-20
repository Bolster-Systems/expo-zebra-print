require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'ExpoZebraPrint'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms      = {
    :ios => '15.1',
    :tvos => '15.1'
  }
  s.swift_version  = '5.9'
  s.source         = { git: 'https://github.com/Bolster-Systems/expo-zebra-print' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # External Accessory framework
  s.frameworks = 'ExternalAccessory'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'HEADER_SEARCH_PATHS' => '$(inherited) "$(PODS_TARGET_SRCROOT)/ZSDK_API.xcframework/ios-arm64/Headers" "$(PODS_TARGET_SRCROOT)/ZSDK_API.xcframework/ios-arm64_x86_64-simulator/Headers"',
    'OTHER_LDFLAGS[sdk=iphonesimulator*]' => '$(inherited) -force_load "$(PODS_TARGET_SRCROOT)/ZSDK_API.xcframework/ios-arm64_x86_64-simulator/ZSDK_API.a"',
    'OTHER_LDFLAGS[sdk=iphoneos*]' => '$(inherited) -force_load "$(PODS_TARGET_SRCROOT)/ZSDK_API.xcframework/ios-arm64/ZSDK_API.a"',
  }

  s.source_files = "*.{h,m,mm,swift,hpp,cpp}", "Zebra*.{h,m}"

  # Preserve the xcframework structure for the app target to use
  s.preserve_paths = 'ZSDK_API.xcframework'
end
