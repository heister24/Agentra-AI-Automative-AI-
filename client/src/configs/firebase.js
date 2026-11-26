import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "ai-automation-5a64a.firebaseapp.com",
  projectId: "ai-automation-5a64a",
  storageBucket: "ai-automation-5a64a.firebasestorage.app",
  messagingSenderId: "547360764608",
  appId: "1:547360764608:web:2bc00242bd132bc214b325",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
