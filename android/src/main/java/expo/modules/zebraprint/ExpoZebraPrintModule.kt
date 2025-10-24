package expo.modules.zebraprint

import android.Manifest
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.content.Context
import android.os.Build
import android.os.Handler
import android.os.Looper
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import com.zebra.sdk.comm.BluetoothConnection
import com.zebra.sdk.comm.Connection
import com.zebra.sdk.printer.ZebraPrinter
import com.zebra.sdk.printer.ZebraPrinterFactory
import com.zebra.sdk.printer.discovery.BluetoothDiscoverer
import com.zebra.sdk.printer.discovery.DiscoveredPrinter
import com.zebra.sdk.printer.discovery.DiscoveryHandler
import java.util.concurrent.ConcurrentHashMap

// Bluetooth Manager to handle scanning and connection
class BluetoothPrinterManager(private val context: Context) {
  private val bluetoothManager: BluetoothManager? = context.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
  private val bluetoothAdapter: BluetoothAdapter? = bluetoothManager?.adapter
  private val discoveredPrinters = ConcurrentHashMap<String, DiscoveredPrinter>()
  private val connectedPrinters = ConcurrentHashMap<String, Connection>()
  private val handler = Handler(Looper.getMainLooper())

  fun scanForPrinters(promise: Promise) {
    discoveredPrinters.clear()
    val printerList = mutableListOf<Map<String, String>>()

    try {
      BluetoothDiscoverer.findPrinters(context, object : DiscoveryHandler {
        override fun foundPrinter(printer: DiscoveredPrinter) {
          discoveredPrinters[printer.address] = printer
        }

        override fun discoveryFinished() {
          // Convert discovered printers to list of maps
          discoveredPrinters.forEach { (address, printer) ->
            printerList.add(mapOf(
              "id" to address,
              "name" to "Zebra Printer ($address)"
            ))
          }
          handler.post {
            promise.resolve(printerList)
          }
        }

        override fun discoveryError(message: String?) {
          handler.post {
            promise.reject("DISCOVERY_ERROR", message ?: "Failed to discover printers", null)
          }
        }
      })
    } catch (e: Exception) {
      promise.reject("SCAN_ERROR", e.message ?: "Failed to scan for printers", e)
    }
  }

  fun connectToPrinter(id: String, promise: Promise) {
    try {
      // Check if already connected
      if (connectedPrinters.containsKey(id)) {
        promise.resolve(true)
        return
      }

      // Create connection
      val connection = BluetoothConnection(id)

      Thread {
        try {
          connection.open()
          connectedPrinters[id] = connection
          handler.post {
            promise.resolve(true)
          }
        } catch (e: Exception) {
          handler.post {
            promise.reject("CONNECTION_FAILED", e.message ?: "Failed to connect to printer", e)
          }
        }
      }.start()
    } catch (e: Exception) {
      promise.reject("CONNECTION_ERROR", e.message ?: "Error connecting to printer", e)
    }
  }

  fun getPairedPrinters(): List<String> {
    val pairedDevices = bluetoothAdapter?.bondedDevices ?: emptySet()
    return pairedDevices
      .filter { it.name?.contains("Zebra", ignoreCase = true) == true }
      .map { it.address }
  }

  fun doPrint(serialNumber: String, labelData: String, promise: Promise) {
    Thread {
      var connection: Connection? = null
      try {
        // Try to use existing connection or create new one
        connection = connectedPrinters[serialNumber] ?: BluetoothConnection(serialNumber).apply {
          open()
        }

        if (!connection.isConnected) {
          connection.open()
        }

        // Get the printer
        val printer: ZebraPrinter = ZebraPrinterFactory.getInstance(connection)

        // Check printer status
        val printerStatus = printer.currentStatus
        if (printerStatus.isReadyToPrint) {
          // Send the label data
          connection.write(labelData.toByteArray())

          handler.post {
            promise.resolve(true)
          }
        } else {
          val statusMessage = buildString {
            if (printerStatus.isPaused) append("Printer is paused. ")
            if (printerStatus.isHeadOpen) append("Printer head is open. ")
            if (printerStatus.isPaperOut) append("Printer is out of paper. ")
          }
          handler.post {
            promise.reject("PRINTER_NOT_READY", statusMessage.ifEmpty { "Printer is not ready" }, null)
          }
        }
      } catch (e: Exception) {
        handler.post {
          promise.reject("PRINT_ERROR", e.message ?: "Failed to print", e)
        }
      } finally {
        // Don't close the connection if it's in our cache
        if (connection != null && !connectedPrinters.containsValue(connection)) {
          try {
            connection.close()
          } catch (e: Exception) {
            // Ignore close errors
          }
        }
      }
    }.start()
  }

  fun cleanup() {
    connectedPrinters.values.forEach { connection ->
      try {
        connection.close()
      } catch (e: Exception) {
        // Ignore close errors
      }
    }
    connectedPrinters.clear()
  }
}

class ExpoZebraPrintModule : Module() {
  private var bluetoothManager: BluetoothPrinterManager? = null

  override fun definition() = ModuleDefinition {
    Name("ExpoZebraPrint")

    OnCreate {
      bluetoothManager = BluetoothPrinterManager(appContext.reactContext ?: throw IllegalStateException("React context not available"))
    }

    OnDestroy {
      bluetoothManager?.cleanup()
    }

    // Request Bluetooth permissions
    AsyncFunction("RequestPermissions") { promise: Promise ->
      val permissions = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        arrayOf(
          Manifest.permission.BLUETOOTH_SCAN,
          Manifest.permission.BLUETOOTH_CONNECT,
          Manifest.permission.ACCESS_FINE_LOCATION
        )
      } else {
        arrayOf(
          Manifest.permission.ACCESS_FINE_LOCATION,
          Manifest.permission.ACCESS_COARSE_LOCATION
        )
      }

      appContext.permissions?.askForPermissions(
        { permissionsResponse ->
          val allGranted = permissionsResponse.values.all { it.status == expo.modules.interfaces.permissions.PermissionsStatus.GRANTED }
          promise.resolve(mapOf(
            "granted" to allGranted,
            "canAskAgain" to permissionsResponse.values.all { it.canAskAgain }
          ))
        },
        *permissions
      ) ?: promise.reject("NO_PERMISSIONS_MODULE", "Permissions module not available", null)
    }

    // GetPrinters function - returns an array of paired Zebra printer addresses
    AsyncFunction("GetPrinters") {
      return@AsyncFunction bluetoothManager?.getPairedPrinters() ?: emptyList<String>()
    }

    // ScanForPrinters function - discovers nearby Bluetooth printers
    AsyncFunction("ScanForPrinters") { promise: Promise ->
      bluetoothManager?.scanForPrinters(promise)
        ?: promise.reject("NO_MANAGER", "Bluetooth manager not initialized", null)
    }

    // ConnectToPrinter function - connects to a discovered Bluetooth printer
    AsyncFunction("ConnectToPrinter") { id: String, promise: Promise ->
      bluetoothManager?.connectToPrinter(id, promise)
        ?: promise.reject("NO_MANAGER", "Bluetooth manager not initialized", null)
    }

    // DoPrint function - sends label data to a printer
    AsyncFunction("DoPrint") { serialNumber: String, labelData: String, promise: Promise ->
      bluetoothManager?.doPrint(serialNumber, labelData, promise)
        ?: promise.reject("NO_MANAGER", "Bluetooth manager not initialized", null)
    }
  }
}
