import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView } from 'react-native';
import { NativeModules } from 'react-native';

const { UHFModule } = NativeModules;

const ParametersScreen: React.FC = () => {
  const [power, setPower] = useState<number | null>(null);
  const [temperature, setTemperature] = useState<number | null>(null);
  const [region, setRegion] = useState<string>('Unknown');
  const [inputPower, setInputPower] = useState<string>('');

  const handleGetPower = async () => {
    try {
      const powerValue = await UHFModule.getPower();
      setPower(powerValue);
    } catch (error) {
      console.error('Failed to get power:', error);
    }
  };

  const handleSetPower = async () => {
    try {
      const powerValue = parseInt(inputPower, 10);
      const result = await UHFModule.setPower(powerValue);
      if (result) {
        setPower(powerValue);
      }
    } catch (error) {
      console.error('Failed to set power:', error);
    }
  };

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
    <ScrollView style={styles.container}>
      <Text style={styles.header}>UHF Parameters</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Power (0-30 dBm):</Text>
        <Text style={styles.value}>{power !== null ? `${power} dBm` : 'Unknown'}</Text>
        <TextInput
          style={styles.input}
          placeholder="Set Power (dBm)"
          value={inputPower}
          onChangeText={setInputPower}
          keyboardType="numeric"
        />
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.button, styles.getButton]} onPress={handleGetPower}>
            <Text style={styles.buttonText}>Get Power</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.setButton]} onPress={handleSetPower}>
            <Text style={styles.buttonText}>Set Power</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Temperature:</Text>
        <Text style={styles.value}>{temperature !== null ? `${temperature} °C` : 'Unknown'}</Text>
        <TouchableOpacity style={[styles.button, styles.getButton]} onPress={handleGetTemperature}>
          <Text style={styles.buttonText}>Get Temperature</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Region:</Text>
        <Text style={styles.value}>{region}</Text>
        <TouchableOpacity style={[styles.button, styles.getButton]} onPress={handleGetRegion}>
          <Text style={styles.buttonText}>Get Region</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
    marginBottom: 30,
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
    elevation: 5,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#7f8fa6',
  },
  value: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#487eb0',
    marginBottom: 20,
  },
  input: {
    height: 45,
    borderColor: '#ced6e0',
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
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
