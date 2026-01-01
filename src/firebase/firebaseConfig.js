import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCQFI4py7vGUo8srAFcAVdtd7FDWDMrfRM",
  authDomain: "carrental-fff4c.firebaseapp.com",
  projectId: "carrental-fff4c",
  storageBucket: "carrental-fff4c.firebasestorage.app",
  messagingSenderId: "191433484488",
  appId: "1:191433484488:web:8e5dd7fb4f065315e31dfd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);