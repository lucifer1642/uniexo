import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDNBfsQXLju1Ob14rTVGGJbiBAsD0XTHsk",
  authDomain: "uniexo.firebaseapp.com",
  projectId: "uniexo",
  storageBucket: "uniexo.firebasestorage.app",
  messagingSenderId: "493372651900",
  appId: "1:493372651900:web:aa3349a555cb8663d84cf9",
  measurementId: "G-G97DQYY27G"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Analytics is only supported in browser
let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) analytics = getAnalytics(app);
  });
}

export { app, auth, googleProvider, analytics };
