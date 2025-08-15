import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyASSf-rv4n52_v_DNzKkMssaQfJFJm88Iw",
  authDomain: "aura-e6045.firebaseapp.com",
  projectId: "aura-e6045",
  storageBucket: "aura-e6045.appspot.com",
  messagingSenderId: "733656810098",
  appId: "1:733656810098:web:c012bac374f17f4a3f78eb",
  measurementId: "G-GCBGM4ZYPV"
};

const app: FirebaseApp = initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);

export { app, auth };