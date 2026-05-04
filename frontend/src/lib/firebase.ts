import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDNBfsQXLju1Ob14rTVGGJbiBAsD0XTHsk",
  authDomain: "uniexo.firebaseapp.com",
  projectId: "uniexo",
  storageBucket: "uniexo.firebasestorage.app",
  messagingSenderId: "493372651900",
  appId: "1:493372651900:web:aa3349a555cb8663d84cf9",
  measurementId: "G-G97DQYY27G",
  databaseURL: "https://uniexo-default-rtdb.europe-west1.firebasedatabase.app/"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
// Analytics is only supported in browser
const analyticsPromise =
  typeof window !== "undefined"
    ? isSupported().then((supported) => (supported ? getAnalytics(app) : null))
    : Promise.resolve(null);

export { app, auth, googleProvider, analyticsPromise };
}

export { app, auth, googleProvider, analytics, db };
