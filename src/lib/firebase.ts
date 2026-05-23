import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDNBfsQXLju1Ob14rTVGGJbiBAsD0XTHsk",
  authDomain: "uniexo.firebaseapp.com",
  databaseURL: "https://uniexo-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "uniexo",
  storageBucket: "uniexo.firebasestorage.app",
  messagingSenderId: "493372651900",
  appId: "1:493372651900:web:aa3349a555cb8663d84cf9",
  measurementId: "G-G97DQYY27G"
};

// Initialize Firebase
// getApps() ensures we don't initialize the app multiple times (common issue with Next.js HMR)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize analytics safely (only on the client-side when supported)
let analytics: any = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, analytics };
