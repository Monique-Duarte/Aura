import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyANX9Mmce7Y6EoUpnevfDsVvVVv401xUDY',
  authDomain: 'controle-financeiro-3680d.firebaseapp.com',
  projectId: 'controle-financeiro-3680d',
  storageBucket: 'controle-financeiro-3680d.firebasestorage.app',
  messagingSenderId: '620141581187',
  appId: '1:620141581187:web:2ac4c211d6af73528c5cb6',
  measurementId: 'G-25Y8Q3593H',
};

console.log('Inicializando Firebase...');
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);