import * as Clipboard from 'expo-clipboard';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

type BillSummaryScreenProps = {
  propertyName: string;
  city: string;
  periodLabel: string;
  electricityTotal: number;
  waterTotal: number;
  arnonaAmount: number;
  vatRate: number | null;
  vatAmount: number;
  totalAmount: number;
  onBack: () => void;
};

function formatAmount(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : '0.00';
}

function buildBillSummaryText(
  t: TFunction,
  {
    propertyName,
    city,
    periodLabel,
    electricityTotal,
    waterTotal,
    arnonaAmount,
    vatRate,
    vatAmount,
    totalAmount,
  }: Omit<BillSummaryScreenProps, 'onBack'>
) {
  const vatLine =
    vatRate !== null
      ? t('billSummary.vatLine', {
          rate: vatRate,
          amount: formatAmount(vatAmount),
        })
      : t('billSummary.vatNotApplied');

  return [
    t('billSummary.shareHeader'),
    ``,
    t('billSummary.shareProperty', { name: propertyName }),
    t('billSummary.shareCity', { name: city }),
    t('billSummary.sharePeriod', { label: periodLabel }),
    ``,
    t('billSummary.rowElectricity', { amount: formatAmount(electricityTotal) }),
    t('billSummary.rowWater', { amount: formatAmount(waterTotal) }),
    t('billSummary.rowArnona', { amount: formatAmount(arnonaAmount) }),
    vatLine,
    ``,
    t('billSummary.total', { amount: formatAmount(totalAmount) }),
  ].join('\n');
}

export function BillSummaryScreen({
  propertyName,
  city,
  periodLabel,
  electricityTotal,
  waterTotal,
  arnonaAmount,
  vatRate,
  vatAmount,
  totalAmount,
  onBack,
}: BillSummaryScreenProps) {
  const { t } = useTranslation();

  const summaryText = buildBillSummaryText(t, {
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

  const handleCopySummary = async () => {
    try {
      await Clipboard.setStringAsync(summaryText);
      Alert.alert(t('billSummary.copiedTitle'), t('billSummary.copiedBody'));
    } catch (error) {
      Alert.alert(t('billSummary.errorCopyTitle'), t('billSummary.errorCopyBody'));
    }
  };

  const handleShareSummary = async () => {
    try {
      await Share.share({
        message: summaryText,
      });
    } catch (error) {
      Alert.alert(t('billSummary.errorShareTitle'), t('billSummary.errorShareBody'));
    }
  };

  const vatDisplay =
    vatRate !== null
      ? `${vatRate}% (${formatAmount(vatAmount)} ${t('billSummary.currencySuffix')})`
      : t('billSummary.vatNotApplied');

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        <Text style={styles.title}>{t('billSummary.title')}</Text>
        <Text style={styles.subtitle}>
          {propertyName} - {city}
        </Text>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>{t('billSummary.period')}</Text>
          <Text style={styles.sectionValue}>{periodLabel}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.row}>
            {t('billSummary.rowElectricity', { amount: formatAmount(electricityTotal) })}
          </Text>
          <Text style={styles.row}>
            {t('billSummary.rowWater', { amount: formatAmount(waterTotal) })}
          </Text>
          <Text style={styles.row}>
            {t('billSummary.rowArnona', { amount: formatAmount(arnonaAmount) })}
          </Text>
          <Text style={styles.row}>
            {t('billSummary.rowVat', { value: vatDisplay })}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.totalRow}>
            {t('billSummary.total', { amount: formatAmount(totalAmount) })}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>{t('billSummary.shareableText')}</Text>
          <Text style={styles.summaryText}>{summaryText}</Text>
        </View>

        <Pressable style={styles.primaryButton} onPress={handleCopySummary}>
          <Text style={styles.primaryButtonText}>{t('billSummary.copy')}</Text>
        </Pressable>

        <Pressable style={styles.primaryButton} onPress={handleShareSummary}>
          <Text style={styles.primaryButtonText}>{t('billSummary.share')}</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={onBack}>
          <Text style={styles.secondaryButtonText}>{t('billSummary.back')}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

export default BillSummaryScreen;

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 64,
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  sectionValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  row: {
    fontSize: 15,
    color: '#374151',
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  totalRow: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#374151',
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
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
    marginTop: 8,
    marginBottom: 24,
  },
  secondaryButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
});
