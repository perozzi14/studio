import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Provides a more helpful error message if the environment variables are missing or are placeholders.
if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes("AIza...")) {
  console.error("🔥🔥🔥 ERROR DE CONFIGURACIÓN FIREBASE 🔥🔥🔥");
  console.error("El valor de NEXT_PUBLIC_FIREBASE_API_KEY en tu archivo .env.local parece ser incorrecto o un marcador de posición.");
  console.error("Por favor, sigue las instrucciones del archivo README.md para solucionarlo.");
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth, app };
