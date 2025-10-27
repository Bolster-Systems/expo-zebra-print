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

  # Vendor the Zebra SDK xcframework
  s.vendored_frameworks = 'ZSDK_API.xcframework'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'OTHER_LDFLAGS' => '$(inherited) -force_load "${PODS_XCFRAMEWORKS_BUILD_DIR}/ExpoZebraPrint/ZSDK_API.framework/ZSDK_API"',
  }

  # Force the app target to also link against the Zebra SDK
  s.user_target_xcconfig = {
    'OTHER_LDFLAGS' => '$(inherited) -framework ZSDK_API',
  }

  s.source_files = "*.{h,m,mm,swift,hpp,cpp}", "Zebra*.{h,m}"
end
