import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  FlatList,
  Text,
  VStack,
  HStack,
  Modal,
  Input,
  Button,
} from 'native-base';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, TouchableOpacity, StyleSheet } from 'react-native';

const { UHFModule } = NativeModules;

const ScanAssignScreen: React.FC = () => {
  const [unassignedTags, setUnassignedTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [objectName, setObjectName] = useState<string>('');
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [scanning, setScanning] = useState<boolean>(false);
  const [tagCount, setTagCount] = useState<number>(0);
  const intervalId = useRef<NodeJS.Timeout | null>(null);

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
      if (intervalId.current) {
        clearInterval(intervalId.current);
      }
      UHFModule.closeUHF().catch((error: any) =>
        console.error("Failed to close UHF module: ", (error as Error).message)
      );
    };
  }, []);

  const trimTrailingZeros = (tag: string): string => {
    return tag.replace(/0+$/, '');
  };

  const loadUnassignedTags = async () => {
    try {
      await UHFModule.startScan();
      setScanning(true);

      intervalId.current = setInterval(async () => {
        const tags = await UHFModule.getTagIDs();
        const assignedTags = await getAssignedTags();
        const unassigned = tags
          .map(trimTrailingZeros)
          .filter((tag: string) => !assignedTags[tag]);

        setUnassignedTags((prevTags) => {
          const newTags = unassigned.filter(
            (tag: any) => !prevTags.includes(tag)
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
      if (intervalId.current) {
        clearInterval(intervalId.current);
        intervalId.current = null;
      }
      await UHFModule.stopScan();
      setScanning(false);
    } catch (error) {
      console.error("Error stopping scan: ", error);
    }
  };

  const clearList = async () => {
    await stopScanning();
    setUnassignedTags([]);
    setTagCount(0);
  };

  const getAssignedTags = async (): Promise<{ [key: string]: string }> => {
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
      setUnassignedTags(unassignedTags.filter((tag) => tag !== selectedTag));
      setIsModalVisible(false);
      setObjectName('');
    }
  };

  const openModal = (tag: string) => {
    setSelectedTag(tag);
    setIsModalVisible(true);
  };

  return (
    <Box flex={1} p={4} bg="gray.100">
      <HStack justifyContent="space-between" mb={4}>
        {!scanning ? (
          <Button onPress={loadUnassignedTags} colorScheme="primary">
            Start Scan
          </Button>
        ) : (
          <Button onPress={stopScanning} colorScheme="danger">
            Stop Scan
          </Button>
        )}
        <Button variant="link" onPress={clearList} _text={{
          fontSize: 'lg',
          fontWeight: 'bold',
          color: 'red',
          textDecorationLine: 'none'

        }}>
          Clear
        </Button>
      </HStack>
      <HStack justifyContent="space-between" mb={4}>
        <Text>Total Tags Scanned: {tagCount}</Text>
      </HStack>
      <FlatList
        data={unassignedTags}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.tagItem}
            onPress={() => openModal(item)}
          >
            <Text>{item}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No unassigned tags found.</Text>
        }
      />
      <Modal isOpen={isModalVisible} onClose={() => setIsModalVisible(false)}>
        <Modal.Content maxWidth="400px">
          <Modal.CloseButton />
          <Modal.Header>Assign Object to Tag: {selectedTag}</Modal.Header>
          <Modal.Body>
            <Input
              placeholder="Enter object name"
              value={objectName}
              onChangeText={setObjectName}
              mt={4}
            />
          </Modal.Body>
          <Modal.Footer>
            <HStack justifyContent="space-between" width="100%">
              <TouchableOpacity onPress={handleAssignTag}>
                <Text style={styles.assignText}>Assign</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </HStack>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </Box>
  );
};

const styles = StyleSheet.create({
  tagItem: {
    padding: 16,
    marginVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
  assignText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'green',
    // textDecorationLine: 'underline',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'red',
    // textDecorationLine: 'underline',
  },
});

export default ScanAssignScreen;
