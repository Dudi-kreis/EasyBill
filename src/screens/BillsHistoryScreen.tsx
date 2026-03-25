import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { auth, db } from '../../firebaseConfig';

type BillItem = {
  id: string;
  periodLabel: string;
  totalAmount: number;
  electricityTotal: number;
  waterTotal: number;
  arnonaAmount: number;
};

type BillsHistoryScreenProps = {
  propertyId: string;
  propertyName: string;
  city: string;
  onBack: () => void;
};

function formatAmount(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : '0.00';
}

export default function BillsHistoryScreen({
  propertyId,
  propertyName,
  city,
  onBack,
}: BillsHistoryScreenProps) {
  const [bills, setBills] = useState<BillItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('BILLS HISTORY PROPERTY ID:', propertyId);
    console.log('BILLS HISTORY PROPERTY NAME:', propertyName);

    const currentUser = auth.currentUser;

    if (!currentUser) {
      setBills([]);
      setLoading(false);
      return;
    }

    const billsQuery = query(
      collection(db, 'monthlyBills'),
      where('ownerId', '==', currentUser.uid),
      where('propertyId', '==', propertyId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      billsQuery,
      (snapshot) => {
        console.log('BILLS HISTORY DOC COUNT:', snapshot.docs.length);

        const nextBills: BillItem[] = snapshot.docs.map((doc) => {
          const data = doc.data();

          return {
            id: doc.id,
            periodLabel: data.periodLabel ?? 'Unknown period',
            totalAmount: typeof data.totalAmount === 'number' ? data.totalAmount : 0,
            electricityTotal:
              typeof data.electricityTotal === 'number' ? data.electricityTotal : 0,
            waterTotal: typeof data.waterTotal === 'number' ? data.waterTotal : 0,
            arnonaAmount: typeof data.arnonaAmount === 'number' ? data.arnonaAmount : 0,
          };
        });

        setBills(nextBills);
        setLoading(false);
      },
      (error) => {
        console.log('BILLS HISTORY ERROR:', error);
        setBills([]);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [propertyId, propertyName]);

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        <Text style={styles.title}>Bills history</Text>
        <Text style={styles.subtitle}>
          {propertyName} - {city}
        </Text>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : bills.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No bills yet</Text>
            <Text style={styles.emptySubtitle}>
              Once you create bills for this property, they will appear here.
            </Text>
          </View>
        ) : (
          <View>
            {bills.map((bill) => (
              <View key={bill.id} style={styles.billCard}>
                <Text style={styles.billPeriod}>{bill.periodLabel}</Text>
                <Text style={styles.billTotal}>Total: {formatAmount(bill.totalAmount)}</Text>

                <View style={styles.detailsBox}>
                  <Text style={styles.detailRow}>
                    Electricity: {formatAmount(bill.electricityTotal)}
                  </Text>
                  <Text style={styles.detailRow}>
                    Water: {formatAmount(bill.waterTotal)}
                  </Text>
                  <Text style={styles.detailRow}>
                    Arnona: {formatAmount(bill.arnonaAmount)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <Pressable style={styles.secondaryButton} onPress={onBack}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

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
  centerBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6B7280',
  },
  billCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  billPeriod: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  billTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563EB',
    marginBottom: 12,
  },
  detailsBox: {
    marginTop: 4,
  },
  detailRow: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 6,
  },
  secondaryButton: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  secondaryButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
});