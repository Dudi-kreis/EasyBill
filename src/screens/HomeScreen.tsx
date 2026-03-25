import { signOut } from 'firebase/auth';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { auth } from '../../firebaseConfig';

type PropertyItem = {
  id: string;
  propertyName: string;
  city: string;
};

type HomeScreenProps = {
  properties: PropertyItem[];
  onAddProperty: () => void;
  onOpenProperty: (propertyId: string) => void;
};

const MAX_PROPERTIES = 3;

export default function HomeScreen({
  properties,
  onAddProperty,
  onOpenProperty,
}: HomeScreenProps) {
  const handleLogout = async () => {
    await signOut(auth);
  };

  const hasProperties = properties.length > 0;
  const reachedLimit = properties.length >= MAX_PROPERTIES;

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        <Text style={styles.screenTitle}>Home</Text>
        <Text style={styles.screenSubtitle}>Manage your properties</Text>

        {!hasProperties ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No properties yet</Text>
            <Text style={styles.emptySubtitle}>
              Add your first property to start using EasyBill.
            </Text>

            <Pressable style={styles.primaryButton} onPress={onAddProperty}>
              <Text style={styles.primaryButtonText}>Add new property</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your properties</Text>
              <Text style={styles.sectionCount}>
                {properties.length}/{MAX_PROPERTIES}
              </Text>
            </View>

            {properties.map((property) => (
              <Pressable
                key={property.id}
                style={styles.propertyCard}
                onPress={() => onOpenProperty(property.id)}
              >
                <Text style={styles.propertyName}>{property.propertyName}</Text>
                <Text style={styles.propertyCity}>{property.city}</Text>
              </Pressable>
            ))}

            {!reachedLimit ? (
              <Pressable style={styles.primaryButton} onPress={onAddProperty}>
                <Text style={styles.primaryButtonText}>Add new property</Text>
              </Pressable>
            ) : (
              <View style={styles.limitBox}>
                <Text style={styles.limitText}>
                  You can add up to 3 properties only.
                </Text>
              </View>
            )}
          </>
        )}

        <Pressable style={styles.secondaryButton} onPress={handleLogout}>
          <Text style={styles.secondaryButtonText}>Log out</Text>
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
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  screenSubtitle: {
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
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  sectionCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  propertyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  propertyName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  propertyCity: {
    fontSize: 15,
    color: '#6B7280',
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  limitBox: {
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
  },
  limitText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  secondaryButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
});