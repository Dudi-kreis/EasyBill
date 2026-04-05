import { doc, updateDoc } from 'firebase/firestore';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
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
  const { t } = useTranslation();
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
      Alert.alert(t('propertySettings.errorTitle'), t('propertySettings.errorBody'));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('propertySettings.title')}</Text>

      <TextInput
        value={electricity}
        onChangeText={setElectricity}
        placeholder={t('propertySettings.placeholderElectricity')}
        style={styles.input}
      />

      <TextInput
        value={water}
        onChangeText={setWater}
        placeholder={t('propertySettings.placeholderWater')}
        style={styles.input}
      />

      <TextInput
        value={arnona}
        onChangeText={setArnona}
        placeholder={t('propertySettings.placeholderArnona')}
        style={styles.input}
      />

      <TextInput
        value={vat}
        onChangeText={setVat}
        placeholder={t('propertySettings.placeholderVat')}
        style={styles.input}
      />

      <Pressable style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>{t('propertySettings.save')}</Text>
      </Pressable>

      <Pressable style={styles.secondary} onPress={onBack}>
        <Text style={styles.secondaryText}>{t('propertySettings.back')}</Text>
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
  secondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
});
