// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDNmPfiTtk8B-CCC7qbC4-B_gNXPEOjHhM",
  authDomain: "controlio-8e0e2.firebaseapp.com",
  projectId: "controlio-8e0e2",
  storageBucket: "controlio-8e0e2.firebasestorage.app",
  messagingSenderId: "858596712343",
  appId: "1:858596712343:web:c67978fd7364bff1042ed2",
  measurementId: "G-NEFCN0648P"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Inicializa Firestore
const db = getFirestore(app);

export { db };
