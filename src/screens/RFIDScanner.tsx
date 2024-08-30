import React, { useState, useEffect } from 'react';
import { NativeModules, Button, Text, View, FlatList } from 'react-native';

// Define the type for the UHFModule
type UHFModuleType = {
  openUHF: () => Promise<string>;
  closeUHF: () => Promise<string>;
  startScan: () => Promise<string>;
  stopScan: () => Promise<string>;
  getTagIDs: () => Promise<string[]>;
};

// Destructure the UHFModule from NativeModules and type it
const { UHFModule } = NativeModules as { UHFModule: UHFModuleType };

const RFIDScanner: React.FC = () => {
  const [message, setMessage] = useState<string>('');
  const [scannedTags, setScannedTags] = useState<string[]>([]);

  useEffect(() => {
    const initializeUHF = async () => {
      try {
        const result = await UHFModule.openUHF();
        setMessage(result);
      } catch (error) {
        setMessage((error as Error).message);
      }
    };

    initializeUHF();

    return () => {
      UHFModule.closeUHF().catch((error) => setMessage((error as Error).message));
    };
  }, []);

  const handleStartScan = async () => {
    try {
      // Ensure UHF is open before scanning
      const openMessage = await UHFModule.openUHF();
      setMessage(openMessage);

      const startMessage = await UHFModule.startScan();
      setMessage(startMessage);

      const intervalId = setInterval(async () => {
        const tags = await UHFModule.getTagIDs();
        setScannedTags((prevTags) => {
          const newTags = tags.filter((tag) => !prevTags.includes(tag));
          return [...prevTags, ...newTags];
        });
      }, 1000);

      setTimeout(async () => {
        clearInterval(intervalId);
        const stopMessage = await UHFModule.stopScan();
        setMessage(stopMessage);
      }, 10000);
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  return (
    <View>
      <Button title="Start Scan" onPress={handleStartScan} />
      <Text>{message}</Text>
      {scannedTags.length > 0 && (
        <View>
          <Text>Scanned Tags:</Text>
          <FlatList
            data={scannedTags}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => <Text>{item}</Text>}
          />
        </View>
      )}
    </View>
  );
};

export default RFIDScanner;
