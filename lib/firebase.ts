import { initializeApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCIQbFi0ogL2uAyRmAqeKn7iNGpun3AFfY",
  authDomain: "perceptive-map-465407-s9.firebaseapp.com",
  databaseURL: "https://perceptive-map-465407-s9-default-rtdb.firebaseio.com",
  projectId: "perceptive-map-465407-s9",
  storageBucket: "perceptive-map-465407-s9.firebasestorage.app",
  messagingSenderId: "383688111435",
  appId: "1:383688111435:web:3707547405604f982224ce",
  measurementId: "G-NKWHPLD8XX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
export const database: Database = getDatabase(app);

// Initialize Firebase Storage and get a reference to the service
export const storage: FirebaseStorage = getStorage(app);

export default app;