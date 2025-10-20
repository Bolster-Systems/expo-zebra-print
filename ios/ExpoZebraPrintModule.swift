import ExpoModulesCore
import ExternalAccessory
import CoreBluetooth

// Bluetooth Manager to handle scanning and connection
class BluetoothPrinterManager: NSObject, CBCentralManagerDelegate, CBPeripheralDelegate {
  var centralManager: CBCentralManager!
  var discoveredPrinters: [String: CBPeripheral] = [:]
  var scanCompletion: (([[String: String]]) -> Void)?
  var connectCompletion: ((Bool, String?) -> Void)?
  var connectingPeripheral: CBPeripheral?

  override init() {
    super.init()
    centralManager = CBCentralManager(delegate: self, queue: nil)
  }

  func startScanning(completion: @escaping ([[String: String]]) -> Void) {
    discoveredPrinters.removeAll()
    scanCompletion = completion

    if centralManager.state == .poweredOn {
      centralManager.scanForPeripherals(withServices: nil, options: [CBCentralManagerScanOptionAllowDuplicatesKey: false])

      // Stop scanning after 10 seconds
      DispatchQueue.main.asyncAfter(deadline: .now() + 10.0) { [weak self] in
        self?.stopScanning()
      }
    } else {
      // If Bluetooth is not ready, return empty array
      completion([])
    }
  }

  func stopScanning() {
    centralManager.stopScan()

    // Convert discovered printers to array of dictionaries
    let printerList = discoveredPrinters.map { (identifier, peripheral) -> [String: String] in
      return [
        "id": peripheral.identifier.uuidString,
        "name": peripheral.name ?? "Unknown Device"
      ]
    }

    scanCompletion?(printerList)
    scanCompletion = nil
  }

  func connectToPrinter(id: String, completion: @escaping (Bool, String?) -> Void) {
    connectCompletion = completion

    // Find the peripheral by ID
    guard let peripheral = discoveredPrinters.values.first(where: { $0.identifier.uuidString == id }) else {
      completion(false, "Printer not found")
      return
    }

    connectingPeripheral = peripheral
    peripheral.delegate = self
    centralManager.connect(peripheral, options: nil)
  }

  // MARK: - CBCentralManagerDelegate

  func centralManagerDidUpdateState(_ central: CBCentralManager) {
    if central.state == .poweredOn {
      // Bluetooth is ready
    } else {
      // Bluetooth is not available
      scanCompletion?([])
      scanCompletion = nil
    }
  }

  func centralManager(_ central: CBCentralManager, didDiscover peripheral: CBPeripheral, advertisementData: [String : Any], rssi RSSI: NSNumber) {
    // Store discovered peripherals
    // We'll filter for printers by name pattern (Zebra printers typically have "Zebra" in their name)
    if let name = peripheral.name, !name.isEmpty {
      discoveredPrinters[peripheral.identifier.uuidString] = peripheral
    }
  }

  func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
    connectCompletion?(true, nil)
    connectCompletion = nil
    connectingPeripheral = nil
  }

  func centralManager(_ central: CBCentralManager, didFailToConnect peripheral: CBPeripheral, error: Error?) {
    connectCompletion?(false, error?.localizedDescription ?? "Failed to connect")
    connectCompletion = nil
    connectingPeripheral = nil
  }

  func centralManager(_ central: CBCentralManager, didDisconnectPeripheral peripheral: CBPeripheral, error: Error?) {
    // Handle disconnection if needed
  }
}

public class ExpoZebraPrintModule: Module {
  let bluetoothManager = BluetoothPrinterManager()

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

    // ScanForPrinters function - discovers nearby Bluetooth printers
    AsyncFunction("ScanForPrinters") { (promise: Promise) in
      self.bluetoothManager.startScanning { printers in
        promise.resolve(printers)
      }
    }

    // ConnectToPrinter function - connects to a discovered Bluetooth printer
    AsyncFunction("ConnectToPrinter") { (id: String, promise: Promise) in
      self.bluetoothManager.connectToPrinter(id: id) { success, error in
        if success {
          promise.resolve(true)
        } else {
          promise.reject("CONNECTION_FAILED", error ?? "Failed to connect to printer")
        }
      }
    }

    // DoPrint function - sends label data to a printer
    AsyncFunction("DoPrint") { (serialNumber: String, labelData: String) -> Bool in
      // Return true for now (dummy implementation)
      return true
    }
  }
}
