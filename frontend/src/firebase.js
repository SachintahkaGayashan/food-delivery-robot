// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// ඔබේ Firebase Console එකෙන් ලබාගත් අදාළ credentials මෙතැනට දමන්න
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDaIDuVITYpH0pzkqaiDaFHORy70YqDFGM",
  authDomain: "test-5b6ed.firebaseapp.com",
  databaseURL: "https://test-5b6ed-default-rtdb.firebaseio.com",
  projectId: "test-5b6ed",
  storageBucket: "test-5b6ed.firebasestorage.app",
  messagingSenderId: "681058995284",
  appId: "1:681058995284:web:b78f5bdb308c12f3e9f1c1",
  measurementId: "G-Y5L1Z63Y5B"
};

// Firebase App එක Initialize කිරීම
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);