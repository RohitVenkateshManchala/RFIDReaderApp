import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Button,
  FlatList,
  Modal,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NativeModules} from 'react-native';

const {UHFModule} = NativeModules;

const ScanAssignScreen: React.FC = () => {
  const [unassignedTags, setUnassignedTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [objectName, setObjectName] = useState<string>('');
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [scanning, setScanning] = useState<boolean>(false);
  const [tagCount, setTagCount] = useState<number>(0);
  let intervalId: NodeJS.Timeout;

  useEffect(() => {
    const initializeUHF = async () => {
      try {
        await UHFModule.openUHF();
      } catch (error) {
        console.error((error as Error).message);
      }
    };

    initializeUHF();

    return () => {
      UHFModule.closeUHF().catch((error: any) =>
        console.error((error as Error).message),
      );
      clearInterval(intervalId); // Ensure the interval is cleared when unmounting
    };
  }, []);

  const trimTrailingZeros = (tag: string): string => {
    return tag.replace(/0+$/, '');
  };

  const loadUnassignedTags = async () => {
    try {
      await UHFModule.startScan();
      setScanning(true);

      intervalId = setInterval(async () => {
        const tags = await UHFModule.getTagIDs();
        const assignedTags = await getAssignedTags();
        const unassigned = tags
          .map(trimTrailingZeros)
          .filter((tag: string) => !assignedTags[tag]);

        setUnassignedTags(prevTags => {
          const newTags = unassigned.filter(
            (tag: any) => !prevTags.includes(tag),
          );
          return [...prevTags, ...newTags];
        });

        const count = await UHFModule.getTagIDCount();
        setTagCount(count);
      }, 500); // Adjust the interval as needed
    } catch (error) {
      console.error(error);
    }
  };

  const stopScanning = async () => {
    try {
      clearInterval(intervalId);
      const stopMessage = await UHFModule.stopScan();
      console.log(stopMessage);
      setScanning(false);
    } catch (error) {
      console.error(error);
    }
  };

  const clearList = async () => {
    await stopScanning();
    setUnassignedTags([]);
    setTagCount(0);
  };

  const getAssignedTags = async (): Promise<{[key: string]: string}> => {
    const storedData = await AsyncStorage.getItem('assignedTags');
    return storedData ? JSON.parse(storedData) : {};
  };

  const saveAssignedTag = async (tag: string, objectName: string) => {
    const assignedTags = await getAssignedTags();
    assignedTags[tag] = objectName;

    await AsyncStorage.setItem('assignedTags', JSON.stringify(assignedTags));
  };

  const handleAssignTag = async () => {
    if (selectedTag && objectName.trim()) {
      await saveAssignedTag(selectedTag, objectName);
      setUnassignedTags(unassignedTags.filter(tag => tag !== selectedTag));
      setIsModalVisible(false);
      setObjectName('');
    }
  };

  const openModal = (tag: string) => {
    setSelectedTag(tag);
    setIsModalVisible(true);
  };

  return (
    <View style={styles.container}>
      {!scanning ? (
        <Button title="Start Scan" onPress={loadUnassignedTags} />
      ) : (
        <Button title="Stop Scan" onPress={stopScanning} />
      )}
      <View style={styles.row}>
        <Text style={styles.tagInfo}>Total Tags Scanned: {tagCount}</Text>
        {/* <TouchableOpacity onPress={clearList}>
        <Text style={styles.clearButton}>Clear</Text>
      </TouchableOpacity> */}
      </View>
      <FlatList
        data={unassignedTags}
        keyExtractor={item => item}
        renderItem={({item}) => (
          <TouchableOpacity
            style={styles.tagItem}
            onPress={() => openModal(item)}>
            <Text>{item}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No unassigned tags found.</Text>
        }
      />
      <Modal visible={isModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Assign Object to Tag: {selectedTag}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter object name"
              value={objectName}
              onChangeText={setObjectName}
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.assignButton]}
                onPress={handleAssignTag}>
                <Text style={styles.buttonText}>Assign</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setIsModalVisible(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    padding: 16,
    marginVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    // elevation: 4,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    padding: 10,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  assignButton: {
    backgroundColor: 'green',
  },
  cancelButton: {
    backgroundColor: 'red',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ScanAssignScreen;
