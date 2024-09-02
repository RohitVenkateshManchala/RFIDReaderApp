import React, { useRef, useState } from 'react';
import { NativeBaseProvider, Box, Button, FlatList, Text, VStack, HStack, ScrollView } from 'native-base';
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
    <Box flex={1} p={4} bg="gray.100">
      <HStack justifyContent="space-between" mb={4}>
        {!scanning ? (
          <Button onPress={handleCheckTags} colorScheme="primary">
            Check Tags
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
      <ScrollView>
        <VStack space={4} flex={1}>
          <FlatList
            data={scannedTags}
            numColumns={2}
            keyExtractor={(item) => item.tag}
            renderItem={({ item }) => (
              <Box
                bg="white"
                shadow={2}
                rounded="lg"
                p={4}
                m={2}
                flex={1}
                maxWidth="48%"
              >
                <Text fontSize="lg" mb={2}>{item.tag}</Text>
                <Text
                  fontSize="md"
                  color={item.status === 'present' ? 'green.500' : 'red.500'}
                >
                  {item.status.toUpperCase()}
                </Text>
                <Button mt={2} colorScheme="red" onPress={() => deleteTagAssignment(item.tag)}>
                  Delete
                </Button>
              </Box>
            )}
            ListEmptyComponent={<Text textAlign="center" mt={4}>No tags scanned yet.</Text>}
          />
        </VStack>
      </ScrollView>
    </Box>
  );
};

export default CheckTagsScreen;