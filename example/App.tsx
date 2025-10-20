import { useState } from 'react';
import ExpoZebraPrint, { type BluetoothPrinter } from 'expo-zebra-print';
import { Button, SafeAreaView, ScrollView, Text, View, StyleSheet, ActivityIndicator } from 'react-native';

export default function App() {
  const [printers, setPrinters] = useState<string[]>([]);
  const [discoveredPrinters, setDiscoveredPrinters] = useState<BluetoothPrinter[]>([]);
  const [connectedBluetoothPrinters, setConnectedBluetoothPrinters] = useState<BluetoothPrinter[]>([]);
  const [printStatus, setPrintStatus] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const handleScanForPrinters = async () => {
    try {
      setIsScanning(true);
      setPrintStatus('Scanning for Bluetooth printers...');
      const discovered = await ExpoZebraPrint.ScanForPrinters();
      setDiscoveredPrinters(discovered);
      setPrintStatus(discovered.length > 0 ? `Found ${discovered.length} device(s)` : 'No devices found');
    } catch (error) {
      setPrintStatus(`Scan error: ${error}`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleConnectToPrinter = async (id: string, name: string) => {
    try {
      setConnectingId(id);
      setPrintStatus(`Connecting to ${name}...`);
      await ExpoZebraPrint.ConnectToPrinter(id);
      setPrintStatus(`Successfully connected to ${name}`);

      // Move printer from discovered to connected list
      const connectedPrinter = discoveredPrinters.find(p => p.id === id);
      if (connectedPrinter) {
        setConnectedBluetoothPrinters(prev => [...prev, connectedPrinter]);
        setDiscoveredPrinters(prev => prev.filter(p => p.id !== id));
      }

      // Refresh the MFi connected printers list
      handleGetPrinters();
    } catch (error) {
      setPrintStatus(`Connection error: ${error}`);
    } finally {
      setConnectingId(null);
    }
  };

  const handleGetPrinters = async () => {
    try {
      const serialNumbers = await ExpoZebraPrint.GetPrinters();
      setPrinters(serialNumbers);
    } catch (error) {
      setPrintStatus(`Error: ${error}`);
    }
  };

  const handleDoPrint = async (serialNumber: string) => {
    try {
      setPrintStatus(`Printing to ${serialNumber}...`);
      // ZPL test label - prints "Hello World" and "Test Print" with a border
      const labelData = '^XA^FO50,50^ADN,36,20^FDHello World^FS^FO50,100^ADN,36,20^FDTest Print^FS^FO30,30^GB350,120,3^FS^XZ';
      await ExpoZebraPrint.DoPrint(serialNumber, labelData);
      setPrintStatus(`Successfully printed to ${serialNumber}`);
    } catch (error: any) {
      setPrintStatus(`Print error: ${error.message || error}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>Zebra Print Module</Text>

        <Group name="Scan for Bluetooth Printers">
          <Button
            title={isScanning ? "Scanning..." : "Scan for Printers"}
            onPress={handleScanForPrinters}
            disabled={isScanning}
          />
          {isScanning && <ActivityIndicator style={styles.spinner} size="large" />}
          {discoveredPrinters.length > 0 ? (
            <View style={styles.printerList}>
              {discoveredPrinters.map((printer) => (
                <View key={printer.id} style={styles.printerItem}>
                  <View style={styles.printerInfo}>
                    <Text style={styles.printerName}>{printer.name}</Text>
                    <Text style={styles.printerId}>{printer.id}</Text>
                  </View>
                  {connectingId === printer.id ? (
                    <ActivityIndicator size="small" />
                  ) : (
                    <Button title="Connect" onPress={() => handleConnectToPrinter(printer.id, printer.name)} />
                  )}
                </View>
              ))}
            </View>
          ) : !isScanning && (
            <Text style={styles.emptyText}>No unconnected printers found</Text>
          )}
        </Group>

        <Group name="Connected Printers">
          <Button title="Refresh Connected Printers" onPress={handleGetPrinters} />

          {/* Bluetooth Connected Printers */}
          {connectedBluetoothPrinters.length > 0 && (
            <>
              <Text style={styles.subHeader}>Bluetooth Devices</Text>
              <View style={styles.printerList}>
                {connectedBluetoothPrinters.map((printer) => (
                  <View key={printer.id} style={styles.printerItem}>
                    <View style={styles.printerInfo}>
                      <Text style={styles.printerName}>{printer.name}</Text>
                      <Text style={styles.printerId}>{printer.id}</Text>
                    </View>
                    <Text style={styles.connectedBadge}>Connected</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* MFi Connected Printers */}
          {printers.length > 0 && (
            <>
              <Text style={styles.subHeader}>MFi Accessories (com.zebra.rawport)</Text>
              <View style={styles.printerList}>
                {printers.map((serial) => (
                  <View key={serial} style={styles.printerItem}>
                    <Text style={styles.serialText}>{serial}</Text>
                    <Button title="Print" onPress={() => handleDoPrint(serial)} />
                  </View>
                ))}
              </View>
            </>
          )}

          {connectedBluetoothPrinters.length === 0 && printers.length === 0 && (
            <Text style={styles.emptyText}>No connected printers</Text>
          )}
        </Group>

        {printStatus !== '' && (
          <Group name="Status">
            <Text style={styles.statusText}>{printStatus}</Text>
          </Group>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Group(props: { name: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupHeader}>{props.name}</Text>
      {props.children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 30,
    margin: 20,
    fontWeight: 'bold',
  },
  groupHeader: {
    fontSize: 20,
    marginBottom: 20,
    fontWeight: '600',
  },
  subHeader: {
    fontSize: 16,
    marginTop: 20,
    marginBottom: 10,
    fontWeight: '600',
    color: '#555',
  },
  group: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  container: {
    flex: 1,
    backgroundColor: '#eee',
  },
  printerList: {
    marginTop: 10,
  },
  printerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  printerInfo: {
    flex: 1,
  },
  printerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  printerId: {
    fontSize: 12,
    color: '#666',
  },
  serialText: {
    fontSize: 16,
    flex: 1,
  },
  statusText: {
    fontSize: 16,
    color: '#333',
  },
  spinner: {
    marginTop: 10,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  connectedBadge: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
});
