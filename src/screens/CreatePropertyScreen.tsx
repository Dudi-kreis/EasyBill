import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { auth, db } from '../../firebaseConfig';

type CreatePropertyScreenProps = {
  propertyCount: number;
  onCreated: () => void;
  onCancel?: () => void;
};

const MAX_PROPERTIES = 3;

export default function CreatePropertyScreen({
  propertyCount,
  onCreated,
  onCancel,
}: CreatePropertyScreenProps) {
  const { t } = useTranslation();
  const [propertyName, setPropertyName] = useState('');
  const [city, setCity] = useState('');
  const [electricityRate, setElectricityRate] = useState('');
  const [waterRate, setWaterRate] = useState('');
  const [arnonaAmount, setArnonaAmount] = useState('');
  const [vatRate, setVatRate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parseNumber = (value: string) => {
    const normalizedValue = value.trim().replace(',', '.');
    return Number(normalizedValue);
  };

  const handleCreateProperty = async () => {
    const user = auth.currentUser;

    if (!user) {
      Alert.alert(t('createProperty.errorCreateTitle'), t('createProperty.errorNoUser'));
      return;
    }

    if (propertyCount >= MAX_PROPERTIES) {
      Alert.alert(t('createProperty.errorLimitTitle'), t('createProperty.errorLimitBody'));
      return;
    }

    if (!propertyName.trim()) {
      Alert.alert(t('createProperty.errorMissingNameTitle'), t('createProperty.errorMissingNameBody'));
      return;
    }

    if (!city.trim()) {
      Alert.alert(t('createProperty.errorMissingCityTitle'), t('createProperty.errorMissingCityBody'));
      return;
    }

    if (!electricityRate.trim()) {
      Alert.alert(
        t('createProperty.errorMissingElectricityTitle'),
        t('createProperty.errorMissingElectricityBody')
      );
      return;
    }

    if (!waterRate.trim()) {
      Alert.alert(t('createProperty.errorMissingWaterTitle'), t('createProperty.errorMissingWaterBody'));
      return;
    }

    if (!arnonaAmount.trim()) {
      Alert.alert(t('createProperty.errorMissingArnonaTitle'), t('createProperty.errorMissingArnonaBody'));
      return;
    }

    const parsedElectricityRate = parseNumber(electricityRate);
    const parsedWaterRate = parseNumber(waterRate);
    const parsedArnonaAmount = parseNumber(arnonaAmount);

    if (Number.isNaN(parsedElectricityRate)) {
      Alert.alert(
        t('createProperty.errorInvalidElectricityTitle'),
        t('createProperty.errorInvalidElectricityBody')
      );
      return;
    }

    if (Number.isNaN(parsedWaterRate)) {
      Alert.alert(t('createProperty.errorInvalidWaterTitle'), t('createProperty.errorInvalidWaterBody'));
      return;
    }

    if (Number.isNaN(parsedArnonaAmount)) {
      Alert.alert(t('createProperty.errorInvalidArnonaTitle'), t('createProperty.errorInvalidArnonaBody'));
      return;
    }

    let parsedVatRate: number | null = null;

    if (vatRate.trim()) {
      parsedVatRate = parseNumber(vatRate);

      if (Number.isNaN(parsedVatRate)) {
        Alert.alert(t('createProperty.errorInvalidVatTitle'), t('createProperty.errorInvalidVatBody'));
        return;
      }
    }

    try {
      setIsSubmitting(true);

      await addDoc(collection(db, 'properties'), {
        ownerId: user.uid,
        propertyName: propertyName.trim(),
        city: city.trim(),
        electricityRate: parsedElectricityRate,
        waterRate: parsedWaterRate,
        arnonaAmount: parsedArnonaAmount,
        vatRate: parsedVatRate,
        createdAt: serverTimestamp(),
      });

      onCreated();
    } catch (error: any) {
      Alert.alert(
        t('createProperty.errorCreateTitle'),
        error?.message || t('createProperty.errorCreateBody')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const reachedLimit = propertyCount >= MAX_PROPERTIES;

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <Text style={styles.title}>{t('createProperty.title')}</Text>
          <Text style={styles.subtitle}>
            {reachedLimit
              ? t('createProperty.subtitleLimit')
              : t('createProperty.subtitleCount', {
                  current: propertyCount + 1,
                  max: MAX_PROPERTIES,
                })}
          </Text>

          {reachedLimit ? (
            <View style={styles.limitBox}>
              <Text style={styles.limitText}>{t('createProperty.limitText')}</Text>
            </View>
          ) : (
            <>
              <TextInput
                value={propertyName}
                onChangeText={setPropertyName}
                placeholder={t('createProperty.placeholderName')}
                style={styles.input}
              />

              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder={t('createProperty.placeholderCity')}
                style={styles.input}
              />

              <TextInput
                value={electricityRate}
                onChangeText={setElectricityRate}
                placeholder={t('createProperty.placeholderElectricity')}
                keyboardType="numeric"
                style={styles.input}
              />

              <TextInput
                value={waterRate}
                onChangeText={setWaterRate}
                placeholder={t('createProperty.placeholderWater')}
                keyboardType="numeric"
                style={styles.input}
              />

              <TextInput
                value={arnonaAmount}
                onChangeText={setArnonaAmount}
                placeholder={t('createProperty.placeholderArnona')}
                keyboardType="numeric"
                style={styles.input}
              />

              <TextInput
                value={vatRate}
                onChangeText={setVatRate}
                placeholder={t('createProperty.placeholderVat')}
                keyboardType="numeric"
                style={styles.input}
              />

              <Pressable
                style={[styles.button, isSubmitting && styles.buttonDisabled]}
                onPress={handleCreateProperty}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>{t('createProperty.submit')}</Text>
                )}
              </Pressable>
            </>
          )}

          {onCancel ? (
            <Pressable
              style={styles.secondaryButton}
              onPress={onCancel}
              disabled={isSubmitting}
            >
              <Text style={styles.secondaryButtonText}>{t('createProperty.back')}</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    color: '#6B7280',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  button: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  secondaryButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
  limitBox: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    marginBottom: 8,
  },
  limitText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '600',
    textAlign: 'center',
  },
});
