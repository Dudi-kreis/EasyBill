import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type PropertyDashboardProps = {
  propertyName: string;
  city: string;
  onOpenNewBill: () => void;
  onOpenBillsHistory?: () => void;
  onOpenSettings: () => void;
  onBack: () => void;
};

export default function PropertyDashboardScreen({
  propertyName,
  city,
  onOpenNewBill,
  onOpenBillsHistory = () => {},
  onOpenSettings,
  onBack,
}: PropertyDashboardProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{propertyName}</Text>
      <Text style={styles.subtitle}>{city}</Text>

      <Pressable style={styles.button} onPress={onOpenNewBill}>
        <Text style={styles.buttonText}>{t('dashboard.newBill')}</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={onOpenBillsHistory}>
        <Text style={styles.buttonText}>{t('dashboard.billsHistory')}</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={onOpenSettings}>
        <Text style={styles.buttonText}>{t('dashboard.propertySettings')}</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={onBack}>
        <Text style={styles.secondaryButtonText}>{t('dashboard.back')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 80,
    backgroundColor: '#F9FAFB',
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
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
});
