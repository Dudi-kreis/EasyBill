import { addDoc, collection, getDocs, limit, orderBy, query, serverTimestamp, where } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
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

type NewBillScreenProps = {
  propertyId: string;
  propertyName: string;
  city: string;
  electricityRate: number;
  waterRate: number;
  arnonaAmount: number;
  vatRate: number | null;
  onBack: () => void;
};

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const YEARS = [2025, 2026, 2027, 2028];

function roundTo2(value: number) {
  return Math.round(value * 100) / 100;
}

export default function NewBillScreen({
  propertyId,
  propertyName,
  city,
  electricityRate,
  waterRate,
  arnonaAmount,
  vatRate,
  onBack,
}: NewBillScreenProps) {
  const [periodType, setPeriodType] = useState<1 | 2>(2);
  const [startMonth, setStartMonth] = useState(new Date().getMonth());
  const [startYear, setStartYear] = useState(new Date().getFullYear());

  const [previousElectricityMeter, setPreviousElectricityMeter] = useState('');
  const [currentElectricityMeter, setCurrentElectricityMeter] = useState('');
  const [previousWaterMeter, setPreviousWaterMeter] = useState('');
  const [currentWaterMeter, setCurrentWaterMeter] = useState('');

  const [loadingPrevious, setLoadingPrevious] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadLastBill = async () => {
      try {
        setLoadingPrevious(true);

        const lastBillQuery = query(
          collection(db, 'monthlyBills'),
          where('propertyId', '==', propertyId),
          orderBy('createdAt', 'desc'),
          limit(1)
        );

        const snapshot = await getDocs(lastBillQuery);

        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();

          if (typeof data.currentElectricityMeter === 'number') {
            setPreviousElectricityMeter(String(data.currentElectricityMeter));
          }

          if (typeof data.currentWaterMeter === 'number') {
            setPreviousWaterMeter(String(data.currentWaterMeter));
          }
        }
      } catch (error) {
        console.log('FAILED TO LOAD LAST BILL:', error);
      } finally {
        setLoadingPrevious(false);
      }
    };

    loadLastBill();
  }, [propertyId]);

  const periodLabel = useMemo(() => {
    if (periodType === 1) {
      return `${MONTHS[startMonth]} ${startYear}`;
    }

    const endMonth = (startMonth + 1) % 12;
    const endYear = startMonth === 11 ? startYear + 1 : startYear;

    if (startYear === endYear) {
      return `${MONTHS[startMonth]} - ${MONTHS[endMonth]} ${startYear}`;
    }

    return `${MONTHS[startMonth]} ${startYear} - ${MONTHS[endMonth]} ${endYear}`;
  }, [periodType, startMonth, startYear]);

  const parsedPreviousElectricity = Number(previousElectricityMeter || 0);
  const parsedCurrentElectricity = Number(currentElectricityMeter || 0);
  const parsedPreviousWater = Number(previousWaterMeter || 0);
  const parsedCurrentWater = Number(currentWaterMeter || 0);

  const electricityUsage =
    !Number.isNaN(parsedCurrentElectricity) &&
    !Number.isNaN(parsedPreviousElectricity) &&
    currentElectricityMeter.trim() &&
    previousElectricityMeter.trim()
      ? Math.max(0, parsedCurrentElectricity - parsedPreviousElectricity)
      : 0;

  const waterUsage =
    !Number.isNaN(parsedCurrentWater) &&
    !Number.isNaN(parsedPreviousWater) &&
    currentWaterMeter.trim() &&
    previousWaterMeter.trim()
      ? Math.max(0, parsedCurrentWater - parsedPreviousWater)
      : 0;

  const electricityTotal = roundTo2(electricityUsage * electricityRate);
  const waterTotal = roundTo2(waterUsage * waterRate);
  const subtotal = roundTo2(electricityTotal + waterTotal + arnonaAmount);
  const vatAmount =
    vatRate !== null ? roundTo2((subtotal * vatRate) / 100) : 0;
  const totalAmount = roundTo2(subtotal + vatAmount);

  const handleSaveBill = async () => {
    const user = auth.currentUser;

    if (!user) {
      Alert.alert('Error', 'No logged in user found.');
      return;
    }

    if (!previousElectricityMeter.trim()) {
      Alert.alert('Missing previous electricity meter', 'Please enter previous electricity meter.');
      return;
    }

    if (!currentElectricityMeter.trim()) {
      Alert.alert('Missing current electricity meter', 'Please enter current electricity meter.');
      return;
    }

    if (!previousWaterMeter.trim()) {
      Alert.alert('Missing previous water meter', 'Please enter previous water meter.');
      return;
    }

    if (!currentWaterMeter.trim()) {
      Alert.alert('Missing current water meter', 'Please enter current water meter.');
      return;
    }

    if (Number.isNaN(parsedPreviousElectricity) || Number.isNaN(parsedCurrentElectricity)) {
      Alert.alert('Invalid electricity meter', 'Electricity meter values must be valid numbers.');
      return;
    }

    if (Number.isNaN(parsedPreviousWater) || Number.isNaN(parsedCurrentWater)) {
      Alert.alert('Invalid water meter', 'Water meter values must be valid numbers.');
      return;
    }

    if (parsedCurrentElectricity < parsedPreviousElectricity) {
      Alert.alert('Invalid electricity meter', 'Current electricity meter cannot be lower than previous meter.');
      return;
    }

    if (parsedCurrentWater < parsedPreviousWater) {
      Alert.alert('Invalid water meter', 'Current water meter cannot be lower than previous meter.');
      return;
    }

    try {
      setIsSubmitting(true);

      await addDoc(collection(db, 'monthlyBills'), {
        propertyId,
        ownerId: user.uid,
        propertyName,
        city,
        periodType,
        startMonth,
        startYear,
        periodLabel,
        previousElectricityMeter: parsedPreviousElectricity,
        currentElectricityMeter: parsedCurrentElectricity,
        electricityUsage,
        electricityRate,
        electricityTotal,
        previousWaterMeter: parsedPreviousWater,
        currentWaterMeter: parsedCurrentWater,
        waterUsage,
        waterRate,
        waterTotal,
        arnonaAmount,
        vatRate,
        vatAmount,
        subtotal,
        totalAmount,
        createdAt: serverTimestamp(),
      });

      Alert.alert('Success', 'Bill saved successfully.');
      onBack();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to save bill.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <Text style={styles.title}>New bill</Text>
          <Text style={styles.subtitle}>
            {propertyName} · {city}
          </Text>

          <Text style={styles.sectionTitle}>Billing period</Text>

          <View style={styles.row}>
            <Pressable
              style={[
                styles.segmentButton,
                periodType === 1 && styles.segmentButtonActive,
              ]}
              onPress={() => setPeriodType(1)}
            >
              <Text
                style={[
                  styles.segmentButtonText,
                  periodType === 1 && styles.segmentButtonTextActive,
                ]}
              >
                1 month
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.segmentButton,
                periodType === 2 && styles.segmentButtonActive,
              ]}
              onPress={() => setPeriodType(2)}
            >
              <Text
                style={[
                  styles.segmentButtonText,
                  periodType === 2 && styles.segmentButtonTextActive,
                ]}
              >
                2 months
              </Text>
            </Pressable>
          </View>

          <Text style={styles.fieldLabel}>Start month</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
            {MONTHS.map((month, index) => (
              <Pressable
                key={month}
                style={[
                  styles.chip,
                  startMonth === index && styles.chipActive,
                ]}
                onPress={() => setStartMonth(index)}
              >
                <Text
                  style={[
                    styles.chipText,
                    startMonth === index && styles.chipTextActive,
                  ]}
                >
                  {month}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.fieldLabel}>Year</Text>
          <View style={styles.row}>
            {YEARS.map((year) => (
              <Pressable
                key={year}
                style={[
                  styles.yearButton,
                  startYear === year && styles.yearButtonActive,
                ]}
                onPress={() => setStartYear(year)}
              >
                <Text
                  style={[
                    styles.yearButtonText,
                    startYear === year && styles.yearButtonTextActive,
                  ]}
                >
                  {year}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.periodBox}>
            <Text style={styles.periodBoxLabel}>Selected period</Text>
            <Text style={styles.periodBoxValue}>{periodLabel}</Text>
          </View>

          <Text style={styles.sectionTitle}>Electricity</Text>

          {loadingPrevious ? (
            <ActivityIndicator color="#2563EB" />
          ) : null}

          <TextInput
            value={previousElectricityMeter}
            onChangeText={setPreviousElectricityMeter}
            placeholder="Previous electricity meter"
            keyboardType="numeric"
            style={styles.input}
          />

          <TextInput
            value={currentElectricityMeter}
            onChangeText={setCurrentElectricityMeter}
            placeholder="Current electricity meter"
            keyboardType="numeric"
            style={styles.input}
          />

          <View style={styles.summaryBox}>
            <Text style={styles.summaryRow}>Usage: {electricityUsage}</Text>
            <Text style={styles.summaryRow}>Rate: {electricityRate}</Text>
            <Text style={styles.summaryRow}>Total: {electricityTotal}</Text>
          </View>

          <Text style={styles.sectionTitle}>Water</Text>

          <TextInput
            value={previousWaterMeter}
            onChangeText={setPreviousWaterMeter}
            placeholder="Previous water meter"
            keyboardType="numeric"
            style={styles.input}
          />

          <TextInput
            value={currentWaterMeter}
            onChangeText={setCurrentWaterMeter}
            placeholder="Current water meter"
            keyboardType="numeric"
            style={styles.input}
          />

          <View style={styles.summaryBox}>
            <Text style={styles.summaryRow}>Usage: {waterUsage}</Text>
            <Text style={styles.summaryRow}>Rate: {waterRate}</Text>
            <Text style={styles.summaryRow}>Total: {waterTotal}</Text>
          </View>

          <Text style={styles.sectionTitle}>Summary</Text>

          <View style={styles.summaryBox}>
            <Text style={styles.summaryRow}>Electricity: {electricityTotal}</Text>
            <Text style={styles.summaryRow}>Water: {waterTotal}</Text>
            <Text style={styles.summaryRow}>Arnona: {arnonaAmount}</Text>
            <Text style={styles.summaryRow}>
              VAT: {vatRate !== null ? `${vatRate}% (${vatAmount})` : 'Not applied'}
            </Text>
            <Text style={styles.totalRow}>Total: {totalAmount}</Text>
          </View>

          <Pressable
            style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
            onPress={handleSaveBill}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Save bill</Text>
            )}
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={onBack} disabled={isSubmitting}>
            <Text style={styles.secondaryButtonText}>Back</Text>
          </Pressable>
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
    padding: 24,
    backgroundColor: '#F9FAFB',
  },
  container: {
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  segmentButton: {
    flex: 1,
    minWidth: 120,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: '#2563EB',
  },
  segmentButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  segmentButtonTextActive: {
    color: '#FFFFFF',
  },
  chipsRow: {
    marginBottom: 12,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#2563EB',
  },
  chipText: {
    color: '#111827',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  yearButton: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  yearButtonActive: {
    backgroundColor: '#2563EB',
  },
  yearButtonText: {
    color: '#111827',
    fontWeight: '600',
  },
  yearButtonTextActive: {
    color: '#FFFFFF',
  },
  periodBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  periodBoxLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  periodBoxValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  summaryBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  summaryRow: {
    fontSize: 15,
    color: '#374151',
    marginBottom: 8,
  },
  totalRow: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  secondaryButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});