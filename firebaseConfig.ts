import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDFTJNLIvirhdrFEFMyJK4936idokyEeMI",
  authDomain: "easybill-app-b74e7.firebaseapp.com",
  projectId: "easybill-app-b74e7",
  storageBucket: "easybill-app-b74e7.firebasestorage.app",
  messagingSenderId: "1093752217797",
  appId: "1:1093752217797:web:ecc4f961e91eb4df4c10ac"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);