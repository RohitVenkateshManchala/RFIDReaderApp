import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {NativeModules} from 'react-native';
import {Slider} from 'native-base';

const {UHFModule} = NativeModules;

const ParametersScreen: React.FC = () => {
  const [temperature, setTemperature] = useState<number | null>(0);
  const [region, setRegion] = useState<string>('-');
  const [inputPower, setInputPower] = useState<number>(30);

  useEffect(() => {
    handleGetPower();
    handleGetTemperature();
    handleGetRegion();
  }, []);

  const handleGetPower = async () => {
    try {
      const powerValue = await UHFModule.getPower();
      // setPower(powerValue);
      setInputPower(powerValue);
    } catch (error) {
      console.error('Failed to get power:', error);
    }
  };

  const handleSetPower = async (value: number) => {
    try {
      const newPower = Math.floor(value);
      const result = await UHFModule.setPower(newPower);
      if (result) {
        setInputPower(newPower);
        // setPower(newPower);
      }
    } catch (error) {
      console.error('Failed to set power:', error);
    }
  };

  // const handleSliderChange = async (value: number) => {
  //   const roundedValue = Math.floor(value);
  //   // setInputPower(roundedValue);
  //   await handleSetPower(roundedValue);
  // };

  const handleGetTemperature = async () => {
    try {
      const temp = await UHFModule.getTemperature();
      setTemperature(temp);
    } catch (error) {
      console.error('Failed to get temperature:', error);
    }
  };

  const handleGetRegion = async () => {
    try {
      const regionValue = await UHFModule.getRegion();
      setRegion(regionValue);
    } catch (error) {
      console.error('Failed to get region:', error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
      <ScrollView>
        <Text style={styles.header}>UHF Parameters</Text>

        <View style={styles.section}>
          <View style={styles.rowContainer}>
            <Text style={styles.label}>Power (5-30 dBm):</Text>
            <Text style={styles.value}>{inputPower} dBm</Text>
          </View>

          <Slider
            value={inputPower}
            onChange={handleSetPower}
            minValue={5}
            maxValue={30}
            step={1}
            size="lg">
            <Slider.Track>
              <Slider.FilledTrack />
            </Slider.Track>
            <Slider.Thumb />
          </Slider>

          {/* <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.getButton]}
              onPress={handleGetPower}>
              <Text style={styles.buttonText}>Get Power</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.setButton]}
              onPress={() => handleSetPower(inputPower)}>
              <Text style={styles.buttonText}>Set Power</Text>
            </TouchableOpacity>
          </View> */}
        </View>

        <View style={styles.section}>
          <View style={styles.rowContainer}>
            <Text style={styles.label}>Temperature:</Text>
            <Text style={styles.value}>
              {temperature !== null ? `${temperature} °C` : 'Unknown'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.button, styles.getButton]}
            onPress={handleGetTemperature}>
            <Text style={styles.buttonText}>Get Temperature</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.rowContainer}>
            <Text style={styles.label}>Region:</Text>
            <Text style={styles.value}>{region}</Text>
          </View>
          <TouchableOpacity
            style={[styles.button, styles.getButton]}
            onPress={handleGetRegion}>
            <Text style={styles.buttonText}>Get Region</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f6fa',
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2f3640',
    marginBottom: 5,
    textAlign: 'center',
  },
  section: {
    marginBottom: 25,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 1,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7f8fa6',
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#487eb0',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    // marginHorizontal: 5,
  },
  getButton: {
    backgroundColor: '#44bd32',
  },
  setButton: {
    backgroundColor: '#0097e6',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ParametersScreen;
