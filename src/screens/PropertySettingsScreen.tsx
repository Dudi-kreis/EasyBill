import { doc, updateDoc } from 'firebase/firestore';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { db } from '../../firebaseConfig';

type Props = {
  propertyId: string;
  electricityRate: number;
  waterRate: number;
  arnonaAmount: number;
  vatRate: number | null;
  onBack: () => void;
};

export default function PropertySettingsScreen({
  propertyId,
  electricityRate,
  waterRate,
  arnonaAmount,
  vatRate,
  onBack,
}: Props) {
  const [electricity, setElectricity] = useState(String(electricityRate));
  const [water, setWater] = useState(String(waterRate));
  const [arnona, setArnona] = useState(String(arnonaAmount));
  const [vat, setVat] = useState(vatRate ? String(vatRate) : '');

  const handleSave = async () => {
    try {
      await updateDoc(doc(db, 'properties', propertyId), {
        electricityRate: Number(electricity),
        waterRate: Number(water),
        arnonaAmount: Number(arnona),
        vatRate: vat ? Number(vat) : null,
      });

      onBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to update property');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Property Settings</Text>

      <TextInput
        value={electricity}
        onChangeText={setElectricity}
        placeholder="Electricity rate"
        style={styles.input}
      />

      <TextInput
        value={water}
        onChangeText={setWater}
        placeholder="Water rate"
        style={styles.input}
      />

      <TextInput
        value={arnona}
        onChangeText={setArnona}
        placeholder="Arnona amount"
        style={styles.input}
      />

      <TextInput
        value={vat}
        onChangeText={setVat}
        placeholder="VAT rate"
        style={styles.input}
      />

      <Pressable style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save</Text>
      </Pressable>

      <Pressable style={styles.secondary} onPress={onBack}>
        <Text>Back</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 80,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
  },
  button: {
    backgroundColor: '#2563EB',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  secondary: {
    marginTop: 20,
    alignItems: 'center',
  },
});