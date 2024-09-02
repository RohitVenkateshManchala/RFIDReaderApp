import React, { useRef, useState } from 'react';
import { View, Text, Button, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules } from 'react-native';

const { UHFModule } = NativeModules;

const CheckTagsScreen: React.FC = () => {
  const [scannedTags, setScannedTags] = useState<{ tag: string, status: 'present' | 'missing' }[]>([]);
  const [scanning, setScanning] = useState<boolean>(false);
  // const [tagCount, setTagCount] = useState<number>(0);
  const intervalId = useRef<NodeJS.Timeout | null>(null); // Use useRef for intervalId

  const trimTrailingZeros = (tag: string): string => {
    return tag.replace(/0+$/, '');
  };

  const handleCheckTags = async () => {
    try {
      await UHFModule.startScan();
      setScanning(true);

      intervalId.current = setInterval(async () => {
        const assignedTags = await getAssignedTags();
        const detectedTags = await UHFModule.getTagIDs();

        const tagsWithStatus = Object.keys(assignedTags).map(tag => ({
          tag: assignedTags[tag],
          status: detectedTags.map(trimTrailingZeros).includes(tag) ? 'present' : 'missing' as 'present' | 'missing'
        }));

        setScannedTags(tagsWithStatus);

        const count = await UHFModule.getTagIDCount();
        // setTagCount(count);

      }, 500); // Adjust the interval as needed
    } catch (error) {
      console.error(error);
    }
  };

  const stopScanning = async () => {
    try {
      if(intervalId.current){
        clearInterval(intervalId.current);
        intervalId.current = null;
      }
      await UHFModule.stopScan();
      setScanning(false);
    } catch (error) {
      console.error("Error stopping scan: ", error);
    }
  };

  const clearList = async () =>{
    await stopScanning();
    setScannedTags([]);
    // setTagCount(0);
  }

  const getAssignedTags = async (): Promise<{ [key: string]: string }> => {
    const storedData = await AsyncStorage.getItem('assignedTags');
    return storedData ? JSON.parse(storedData) : {};
  };

  const deleteTagAssignment = async (tag: string) => {
    try {
      const assignedTags = await getAssignedTags();

      // Find the key corresponding to the object name (tag) to delete
      const tagKey = Object.keys(assignedTags).find(key => assignedTags[key] === tag);

      if (tagKey) {
        delete assignedTags[tagKey];  // Remove the assignment
        await AsyncStorage.setItem('assignedTags', JSON.stringify(assignedTags));

        // Update the scannedTags state to reflect the change
        setScannedTags(scannedTags.filter(scannedTag => scannedTag.tag !== tag));
      }
    } catch (error) {
      console.error("Failed to delete tag assignment:", error);
    }
  };

  return (
    <View style={styles.container}>
      {!scanning ? (
        <Button title="Check Tags" onPress={handleCheckTags} />
      ) : (
        <Button title="Stop Scan" onPress={stopScanning} />
      )}
      <View style={styles.row}>
      {/* <Text style={styles.tagInfo}>Total Tags Scanned: {tagCount}</Text> */}
        <TouchableOpacity onPress={clearList}>
          <Text style={styles.clearButton}>Clear</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={scannedTags}
        keyExtractor={(item) => item.tag}
        renderItem={({ item }) => (
          <View style={[styles.tagItem, item.status === 'present' ? styles.present : styles.missing]}>
            <Text>{item.tag}</Text>
            <TouchableOpacity onPress={() => deleteTagAssignment(item.tag)} style={styles.deleteButton}>
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No tags scanned yet.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f7f7f7',
  },
  tagItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  present: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
  },
  missing: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#ff4d4f',
    borderRadius: 4,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
  },
  tagInfo: {
    fontSize: 16,
    marginTop: 10,
    marginRight: 10,
  },
  clearButton: {
    fontSize: 16,
    color: 'tomato',
    textDecorationLine: 'underline',
  },
});

export default CheckTagsScreen;