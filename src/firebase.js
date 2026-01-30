import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getFunctions } from 'firebase/functions'

// Twoja konfiguracja Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD-1rJI37yekyd4NDYhIvFfm-J0_xL8-GU",
  authDomain: "pallet-manager-fc527.firebaseapp.com",
  projectId: "pallet-manager-fc527",
  storageBucket: "pallet-manager-fc527.firebasestorage.app",
  messagingSenderId: "457214335036",
  appId: "1:457214335036:web:76b2047cd50db5aaa80b39"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize services
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)
export const storage = getStorage(app)
export const functions = getFunctions(app)

export default app