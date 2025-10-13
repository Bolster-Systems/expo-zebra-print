import { useState } from 'react';
import ExpoZebraPrint from 'expo-zebra-print';
import { Button, SafeAreaView, ScrollView, Text, View, StyleSheet } from 'react-native';

export default function App() {
  const [printers, setPrinters] = useState<string[]>([]);
  const [printStatus, setPrintStatus] = useState<string>('');

  const handleGetPrinters = async () => {
    try {
      const serialNumbers = await ExpoZebraPrint.GetPrinters();
      setPrinters(serialNumbers);
      setPrintStatus('');
    } catch (error) {
      setPrintStatus(`Error: ${error}`);
    }
  };

  const handleDoPrint = async (serialNumber: string) => {
    try {
      const labelData = '^XA^FO50,50^ADN,36,20^FDHello World^FS^XZ';
      const success = await ExpoZebraPrint.DoPrint(serialNumber, labelData);
      setPrintStatus(success ? `Print sent to ${serialNumber}` : 'Print failed');
    } catch (error) {
      setPrintStatus(`Error: ${error}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>Zebra Print Module</Text>

        <Group name="Get Printers">
          <Button title="Get Available Printers" onPress={handleGetPrinters} />
          {printers.length > 0 && (
            <View style={styles.printerList}>
              {printers.map((serial) => (
                <View key={serial} style={styles.printerItem}>
                  <Text style={styles.serialText}>{serial}</Text>
                  <Button title="Print" onPress={() => handleDoPrint(serial)} />
                </View>
              ))}
            </View>
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
    marginTop: 20,
  },
  printerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  serialText: {
    fontSize: 16,
    flex: 1,
  },
  statusText: {
    fontSize: 16,
    color: '#333',
  },
});
