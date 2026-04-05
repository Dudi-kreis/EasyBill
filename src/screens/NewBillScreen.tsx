import { addDoc, collection, getDocs, limit, orderBy, query, serverTimestamp, where } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
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

type NewBillScreenProps = {
  propertyId: string;
  propertyName: string;
  city: string;
  electricityRate: number;
  waterRate: number;
  arnonaAmount: number;
  vatRate: number | null;
  onBack: () => void;
  onSaved: (billSummary: {
    propertyName: string;
    city: string;
    periodLabel: string;
    electricityTotal: number;
    waterTotal: number;
    arnonaAmount: number;
    vatRate: number | null;
    vatAmount: number;
    totalAmount: number;
  }) => void;
};

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
  onSaved,
  onBack,
}: NewBillScreenProps) {
  const { t, i18n } = useTranslation();
  const [periodType, setPeriodType] = useState<1 | 2>(2);
  const [startMonth, setStartMonth] = useState(new Date().getMonth());
  const [startYear, setStartYear] = useState(new Date().getFullYear());

  const [previousElectricityMeter, setPreviousElectricityMeter] = useState('');
  const [currentElectricityMeter, setCurrentElectricityMeter] = useState('');
  const [previousWaterMeter, setPreviousWaterMeter] = useState('');
  const [currentWaterMeter, setCurrentWaterMeter] = useState('');

  const [loadingPrevious, setLoadingPrevious] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const monthNames = useMemo(
    () => t('newBill.monthNames', { returnObjects: true }) as string[],
    [t, i18n.language]
  );

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
      return `${monthNames[startMonth]} ${startYear}`;
    }

    const endMonth = (startMonth + 1) % 12;
    const endYear = startMonth === 11 ? startYear + 1 : startYear;

    if (startYear === endYear) {
      return `${monthNames[startMonth]} - ${monthNames[endMonth]} ${startYear}`;
    }

    return `${monthNames[startMonth]} ${startYear} - ${monthNames[endMonth]} ${endYear}`;
  }, [periodType, startMonth, startYear, monthNames]);

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
      Alert.alert(t('newBill.errorSaveTitle'), t('newBill.errorNoUser'));
      return;
    }

    if (!previousElectricityMeter.trim()) {
      Alert.alert(t('newBill.errorPrevElectricityTitle'), t('newBill.errorPrevElectricityBody'));
      return;
    }

    if (!currentElectricityMeter.trim()) {
      Alert.alert(t('newBill.errorCurrElectricityTitle'), t('newBill.errorCurrElectricityBody'));
      return;
    }

    if (!previousWaterMeter.trim()) {
      Alert.alert(t('newBill.errorPrevWaterTitle'), t('newBill.errorPrevWaterBody'));
      return;
    }

    if (!currentWaterMeter.trim()) {
      Alert.alert(t('newBill.errorCurrWaterTitle'), t('newBill.errorCurrWaterBody'));
      return;
    }

    if (Number.isNaN(parsedPreviousElectricity) || Number.isNaN(parsedCurrentElectricity)) {
      Alert.alert(t('newBill.errorInvalidElectricityTitle'), t('newBill.errorInvalidElectricityBody'));
      return;
    }

    if (Number.isNaN(parsedPreviousWater) || Number.isNaN(parsedCurrentWater)) {
      Alert.alert(t('newBill.errorInvalidWaterTitle'), t('newBill.errorInvalidWaterBody'));
      return;
    }

    if (parsedCurrentElectricity < parsedPreviousElectricity) {
      Alert.alert(t('newBill.errorElectricityOrderTitle'), t('newBill.errorElectricityOrderBody'));
      return;
    }

    if (parsedCurrentWater < parsedPreviousWater) {
      Alert.alert(t('newBill.errorWaterOrderTitle'), t('newBill.errorWaterOrderBody'));
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

      onSaved({
        propertyName,
        city,
        periodLabel,
        electricityTotal,
        waterTotal,
        arnonaAmount,
        vatRate,
        vatAmount,
        totalAmount,
      });
    } catch (error: any) {
      Alert.alert(t('newBill.errorSaveTitle'), error?.message || t('newBill.errorSaveBody'));
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
          <Text style={styles.title}>{t('newBill.title')}</Text>
          <Text style={styles.subtitle}>
            {propertyName} · {city}
          </Text>

          <Text style={styles.sectionTitle}>{t('newBill.billingPeriod')}</Text>

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
                {t('newBill.oneMonth')}
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
                {t('newBill.twoMonths')}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.fieldLabel}>{t('newBill.startMonth')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
            {monthNames.map((month, index) => (
              <Pressable
                key={month}
                style={[styles.chip, startMonth === index && styles.chipActive]}
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

          <Text style={styles.fieldLabel}>{t('newBill.year')}</Text>
          <View style={styles.row}>
            {YEARS.map((year) => (
              <Pressable
                key={year}
                style={[styles.yearButton, startYear === year && styles.yearButtonActive]}
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
            <Text style={styles.periodBoxLabel}>{t('newBill.selectedPeriod')}</Text>
            <Text style={styles.periodBoxValue}>{periodLabel}</Text>
          </View>

          <Text style={styles.sectionTitle}>{t('newBill.electricity')}</Text>

          {loadingPrevious ? (
            <ActivityIndicator color="#2563EB" />
          ) : null}

          <TextInput
            value={previousElectricityMeter}
            onChangeText={setPreviousElectricityMeter}
            placeholder={t('newBill.placeholderPrevElectricity')}
            keyboardType="numeric"
            style={styles.input}
          />

          <TextInput
            value={currentElectricityMeter}
            onChangeText={setCurrentElectricityMeter}
            placeholder={t('newBill.placeholderCurrElectricity')}
            keyboardType="numeric"
            style={styles.input}
          />

          <View style={styles.summaryBox}>
            <Text style={styles.summaryRow}>{t('newBill.usage', { value: electricityUsage })}</Text>
            <Text style={styles.summaryRow}>{t('newBill.rate', { value: electricityRate })}</Text>
            <Text style={styles.summaryRow}>{t('newBill.total', { value: electricityTotal })}</Text>
          </View>

          <Text style={styles.sectionTitle}>{t('newBill.water')}</Text>

          <TextInput
            value={previousWaterMeter}
            onChangeText={setPreviousWaterMeter}
            placeholder={t('newBill.placeholderPrevWater')}
            keyboardType="numeric"
            style={styles.input}
          />

          <TextInput
            value={currentWaterMeter}
            onChangeText={setCurrentWaterMeter}
            placeholder={t('newBill.placeholderCurrWater')}
            keyboardType="numeric"
            style={styles.input}
          />

          <View style={styles.summaryBox}>
            <Text style={styles.summaryRow}>{t('newBill.usage', { value: waterUsage })}</Text>
            <Text style={styles.summaryRow}>{t('newBill.rate', { value: waterRate })}</Text>
            <Text style={styles.summaryRow}>{t('newBill.total', { value: waterTotal })}</Text>
          </View>

          <Text style={styles.sectionTitle}>{t('newBill.summary')}</Text>

          <View style={styles.summaryBox}>
            <Text style={styles.summaryRow}>
              {t('newBill.lineElectricity', { value: electricityTotal })}
            </Text>
            <Text style={styles.summaryRow}>{t('newBill.lineWater', { value: waterTotal })}</Text>
            <Text style={styles.summaryRow}>{t('newBill.lineArnona', { value: arnonaAmount })}</Text>
            <Text style={styles.summaryRow}>
              {vatRate !== null
                ? t('newBill.vatSummaryWithRate', { rate: vatRate, amount: vatAmount })
                : t('newBill.vatSummaryNone')}
            </Text>
            <Text style={styles.totalRow}>{t('newBill.total', { value: totalAmount })}</Text>
          </View>

          <Pressable
            style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
            onPress={handleSaveBill}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>{t('newBill.saveBill')}</Text>
            )}
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={onBack} disabled={isSubmitting}>
            <Text style={styles.secondaryButtonText}>{t('newBill.back')}</Text>
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
