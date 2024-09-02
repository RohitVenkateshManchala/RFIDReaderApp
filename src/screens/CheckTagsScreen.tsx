import React, {useRef, useState} from 'react';
import {
  NativeBaseProvider,
  Box,
  Button,
  FlatList,
  Text,
  VStack,
  HStack,
  ScrollView,
} from 'native-base';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NativeModules, Vibration} from 'react-native';

const {UHFModule} = NativeModules;

const CheckTagsScreen: React.FC = () => {
  const [scannedTags, setScannedTags] = useState<
    {tag: string; status: 'present' | 'missing'}[]
  >([]);
  const [scanning, setScanning] = useState<boolean>(false);
  const intervalId = useRef<NodeJS.Timeout | null>(null);

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
          status: detectedTags.map(trimTrailingZeros).includes(tag)
            ? 'present'
            : ('missing' as 'present' | 'missing'),
        }));

        // Trigger vibration for each newly detected tag
        const newTags = tagsWithStatus.filter(
          tag => !scannedTags.some(scannedTag => scannedTag.tag === tag.tag),
        );
        if (newTags.length > 0) {
          Vibration.vibrate(200); // Vibrate for 200ms
        }

        setScannedTags(tagsWithStatus);
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
      console.error('Error stopping scan: ', error);
    }
  };

  const clearList = async () => {
    await stopScanning();
    setScannedTags([]);
  };

  const getAssignedTags = async (): Promise<{[key: string]: string}> => {
    const storedData = await AsyncStorage.getItem('assignedTags');
    return storedData ? JSON.parse(storedData) : {};
  };

  const deleteTagAssignment = async (tag: string) => {
    try {
      const assignedTags = await getAssignedTags();

      const tagKey = Object.keys(assignedTags).find(
        key => assignedTags[key] === tag,
      );

      if (tagKey) {
        delete assignedTags[tagKey];
        await AsyncStorage.setItem(
          'assignedTags',
          JSON.stringify(assignedTags),
        );

        setScannedTags(
          scannedTags.filter(scannedTag => scannedTag.tag !== tag),
        );
      }
    } catch (error) {
      console.error('Failed to delete tag assignment:', error);
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
        <Button
          variant="link"
          onPress={clearList}
          _text={{
            fontSize: 'lg',
            fontWeight: 'bold',
            color: 'red',
          }}>
          Clear
        </Button>
      </HStack>
      <ScrollView>
        <VStack space={4} flex={1}>
          <FlatList
            data={scannedTags}
            numColumns={2}
            keyExtractor={item => item.tag}
            renderItem={({item}) => (
              <Box
                bg={item.status === 'present' ? 'green.600' : 'red.400'}
                rounded="lg"
                p={4}
                m={2}
                flex={1}
                maxWidth="48%">
                <Text fontSize="xl" mb={2} fontWeight="bold" color='white'>
                  {item.tag}
                </Text>
                {/* <Text
                  fontSize="md"
                  color="white">
                  {item.status.toUpperCase()}
                </Text> */}
                <Button
                  mt={2}
                  colorScheme="red"
                  onPress={() => deleteTagAssignment(item.tag)}>
                  Unassign
                </Button>
              </Box>
            )}
            ListEmptyComponent={
              <Text textAlign="center" mt={4}>
                No tags scanned yet.
              </Text>
            }
          />
        </VStack>
      </ScrollView>
    </Box>
  );
};

export default CheckTagsScreen;
