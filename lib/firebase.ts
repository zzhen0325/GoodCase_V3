import { initializeApp } from 'firebase/app';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, Analytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyCIQbFi0ogL2uAyRmAqeKn7iNGpun3AFfY",
  authDomain: "perceptive-map-465407-s9.firebaseapp.com",
  projectId: "perceptive-map-465407-s9",
  storageBucket: "perceptive-map-465407-s9.firebasestorage.app",
  messagingSenderId: "383688111435",
  appId: "1:383688111435:web:948c86bc46b430222224ce",
  measurementId: "G-90M1DVZKQT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Storage and get a reference to the service
export const storage: FirebaseStorage = getStorage(app);

// Initialize Analytics (only in browser environment)
export let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export default app;