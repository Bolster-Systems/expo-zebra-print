import ExpoModulesCore
import ExternalAccessory

public class ExpoZebraPrintModule: Module {
  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  public func definition() -> ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('ExpoZebraPrint')` in JavaScript.
    Name("ExpoZebraPrint")

    // GetPrinters function - returns an array of printer serial numbers
    AsyncFunction("GetPrinters") { () -> [String] in
      // Get all connected accessories
      let accessoryManager = EAAccessoryManager.shared()
      let connectedAccessories = accessoryManager.connectedAccessories

      // Filter for Zebra printers and map to serial numbers
      let serialNumbers = connectedAccessories
        .filter { $0.protocolStrings.contains("com.zebra.rawport") }
        .map { $0.serialNumber }

      return serialNumbers
    }

    // DoPrint function - sends label data to a printer
    AsyncFunction("DoPrint") { (serialNumber: String, labelData: String) -> Bool in
      // Return true for now (dummy implementation)
      return true
    }
  }
}
