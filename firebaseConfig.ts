import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, type Persistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: 'AIzaSyDFTJNLIvirhdrFEFMyJK4936idokyEeMI',
  authDomain: 'easybill-app-b74e7.firebaseapp.com',
  projectId: 'easybill-app-b74e7',
  storageBucket: 'easybill-app-b74e7.firebasestorage.app',
  messagingSenderId: '1093752217797',
  appId: '1:1093752217797:web:ecc4f961e91eb4df4c10ac',
};

const app = initializeApp(firebaseConfig);

function createReactNativePersistence(): Persistence {
  const { getReactNativePersistence: createRnPersistence } =
    // RN bundle export; root typings omit it (see @firebase/auth/dist/rn)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@firebase/auth/dist/rn/index.js') as {
      getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence;
    };
  return createRnPersistence(AsyncStorage);
}

function createAuth() {
  if (Platform.OS === 'web') {
    return getAuth(app);
  }

  try {
    return initializeAuth(app, {
      persistence: createReactNativePersistence(),
    });
  } catch {
    return getAuth(app);
  }
}

export const auth = createAuth();
export const db = getFirestore(app);
