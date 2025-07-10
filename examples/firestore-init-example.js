// Example: Initialize Cloud Firestore instance
// This file demonstrates how to initialize Firestore following the official Firebase documentation

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Replace the following with your app's Firebase project configuration
// See: https://support.google.com/firebase/answer/7015592
const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// Export for use in other parts of your application
export { app, db };

// Example usage:
// import { db } from './firestore-init-example.js';
// import { collection, addDoc } from 'firebase/firestore';
// 
// // Add a new document with a generated id
// const docRef = await addDoc(collection(db, "users"), {
//   first: "Ada",
//   last: "Lovelace",
//   born: 1815
// });
// console.log("Document written with ID: ", docRef.id);