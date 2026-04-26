import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDFYzKgzRbD6fDMRRYlYNA7WEn6FlLp7dg",
  authDomain: "fir-9c17d.firebaseapp.com",
  projectId: "fir-9c17d",
  storageBucket: "fir-9c17d.firebasestorage.app",
  messagingSenderId: "585481598234",
  appId: "1:585481598234:web:588750fad99ad6d008e8a3",
  measurementId: "G-YY90HH7900"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
