import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { auth, db } from '../firebaseConfig';

import AuthScreen from '../src/screens/AuthScreen';
import BillsHistoryScreen from '../src/screens/BillsHistoryScreen';
import { BillSummaryScreen } from '../src/screens/BillSummaryScreen';
import CreatePropertyScreen from '../src/screens/CreatePropertyScreen';
import HomeScreen from '../src/screens/HomeScreen';
import NewBillScreen from '../src/screens/NewBillScreen';
import PropertyDashboardScreen from '../src/screens/PropertyDashboardScreen';
import PropertySettingsScreen from '../src/screens/PropertySettingsScreen';

export type PropertyItem = {
  id: string;
  propertyName: string;
  city: string;
  electricityRate: number;
  waterRate: number;
  arnonaAmount: number;
  vatRate: number | null;
};

type ActiveScreen =
  | 'home'
  | 'createProperty'
  | 'propertyDashboard'
  | 'propertySettings'
  | 'newBill'
  | 'billsHistory'
  | 'billSummary';
  
export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [latestBillSummary, setLatestBillSummary] = useState<{
    propertyName: string;
    city: string;
    periodLabel: string;
    electricityTotal: number;
    waterTotal: number;
    arnonaAmount: number;
    vatRate: number | null;
    vatAmount: number;
    totalAmount: number;
  } | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('home');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('AUTH USER:', firebaseUser?.uid ?? null);
      setUser(firebaseUser);
      setLoadingAuth(false);

      if (!firebaseUser) {
        setProperties([]);
        setSelectedPropertyId(null);
        setActiveScreen('home');
        setLoadingProperties(false);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    console.log('CHECKING PROPERTIES FOR USER:', user.uid);
    setLoadingProperties(true);

    const q = query(
      collection(db, 'properties'),
      where('ownerId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log('PROPERTIES DOC COUNT:', snapshot.docs.length);

        const nextProperties: PropertyItem[] = snapshot.docs.map((doc) => {
          const data = doc.data();

          return {
            id: doc.id,
            propertyName: data.propertyName ?? '',
            city: data.city ?? '',
            electricityRate: typeof data.electricityRate === 'number' ? data.electricityRate : 0,
            waterRate: typeof data.waterRate === 'number' ? data.waterRate : 0,
            arnonaAmount: typeof data.arnonaAmount === 'number' ? data.arnonaAmount : 0,
            vatRate: typeof data.vatRate === 'number' ? data.vatRate : null,
          };
        });

        setProperties(nextProperties);
        setLoadingProperties(false);
      },
      (error) => {
        console.log('PROPERTIES ERROR:', error);
        setProperties([]);
        setLoadingProperties(false);
      }
    );

    return unsubscribe;
  }, [user]);

  const selectedProperty = useMemo(() => {
    return properties.find((property) => property.id === selectedPropertyId) ?? null;
  }, [properties, selectedPropertyId]);

  useEffect(() => {
    if (selectedPropertyId && !selectedProperty) {
      setSelectedPropertyId(null);
      setActiveScreen('home');
    }
  }, [selectedPropertyId, selectedProperty]);

  if (loadingAuth || (user && loadingProperties)) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (activeScreen === 'createProperty') {
    return (
      <CreatePropertyScreen
        propertyCount={properties.length}
        onCreated={() => {
          setActiveScreen('home');
        }}
        onCancel={() => {
          setActiveScreen('home');
        }}
      />
    );
  }

  if (activeScreen === 'propertyDashboard' && selectedProperty) {
    return (
      <PropertyDashboardScreen
        propertyName={selectedProperty.propertyName}
        city={selectedProperty.city}
        onOpenNewBill={() => {
          setActiveScreen('newBill');
        }}
        onOpenBillsHistory={() => {
          setActiveScreen('billsHistory');
        }}
        onOpenSettings={() => {
          setActiveScreen('propertySettings');
        }}
        onBack={() => {
          setActiveScreen('home');
        }}
      />
    );
  }
  if (activeScreen === 'newBill' && selectedProperty) {
    return (
      <NewBillScreen
        propertyId={selectedProperty.id}
        propertyName={selectedProperty.propertyName}
        city={selectedProperty.city}
        electricityRate={selectedProperty.electricityRate}
        waterRate={selectedProperty.waterRate}
        arnonaAmount={selectedProperty.arnonaAmount}
        vatRate={selectedProperty.vatRate}
        onBack={() => {
          setActiveScreen('propertyDashboard');
        }}
        onSaved={(billSummary) => {
          setLatestBillSummary(billSummary);
          setActiveScreen('billSummary');
        }}
      />
    );
  }


  if (activeScreen === 'propertySettings' && selectedProperty) {
    return (
      <PropertySettingsScreen
        propertyId={selectedProperty.id}
        electricityRate={selectedProperty.electricityRate}
        waterRate={selectedProperty.waterRate}
        arnonaAmount={selectedProperty.arnonaAmount}
        vatRate={selectedProperty.vatRate}
        onBack={() => {
          setActiveScreen('propertyDashboard');
        }}
      />
    );
  }

  if (activeScreen === 'billsHistory' && selectedProperty) {
    return (
      <BillsHistoryScreen
        propertyId={selectedProperty.id}
        propertyName={selectedProperty.propertyName}
        city={selectedProperty.city}
        onBack={() => {
          setActiveScreen('propertyDashboard');
        }}
      />
    );
  }
  if (activeScreen === 'billSummary' && latestBillSummary) {
    return (
      <BillSummaryScreen
        propertyName={latestBillSummary.propertyName}
        city={latestBillSummary.city}
        periodLabel={latestBillSummary.periodLabel}
        electricityTotal={latestBillSummary.electricityTotal}
        waterTotal={latestBillSummary.waterTotal}
        arnonaAmount={latestBillSummary.arnonaAmount}
        vatRate={latestBillSummary.vatRate}
        vatAmount={latestBillSummary.vatAmount}
        totalAmount={latestBillSummary.totalAmount}
        onBack={() => {
          setActiveScreen('propertyDashboard');
        }}
      />
    );
  }

  return (
    <HomeScreen
      properties={properties}
      onAddProperty={() => {
        setActiveScreen('createProperty');
      }}
      onOpenProperty={(propertyId) => {
        setSelectedPropertyId(propertyId);
        setActiveScreen('propertyDashboard');
      }}
    />
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});