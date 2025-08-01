import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { calculateFinancialPeriod } from '../logic/dateLogic';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import app from '../firebaseConfig';

interface IDatePeriod {
  startDate: Date;
  endDate: Date;
}

interface IDateContext {
  currentPeriod: IDatePeriod;
  startDay: number;
  setStartDay: (day: number) => void;
}

const DateContext = createContext<IDateContext | undefined>(undefined);

export const DateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [startDay, setStartDayState] = useState<number>(1);
  const [currentPeriod, setCurrentPeriod] = useState<IDatePeriod>(calculateFinancialPeriod(1));
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser) {
      const fetchSettings = async () => {
        const db = getFirestore(app);
        const settingsDocRef = doc(db, 'users', currentUser.uid, 'settings', 'preferences');
        const docSnap = await getDoc(settingsDocRef);

        if (docSnap.exists() && docSnap.data().financialStartDay) {
          setStartDayState(docSnap.data().financialStartDay);
        } else {
          setStartDayState(1);
        }
      };
      fetchSettings();
    } else {
      setStartDayState(1);
    }
  }, [currentUser]);

  useEffect(() => {
    setCurrentPeriod(calculateFinancialPeriod(startDay));
  }, [startDay]);

  const setStartDay = async (day: number) => {
    if (!currentUser) {
      console.error("Não é possível salvar as configurações: usuário não está logado.");
      return;
    }
    
    const db = getFirestore(app);
    const settingsDocRef = doc(db, 'users', currentUser.uid, 'settings', 'preferences');
    
    try {
      await setDoc(settingsDocRef, { financialStartDay: day }, { merge: true });
       setStartDayState(day);
    } catch (error) {
      console.error("Erro ao salvar a preferência de data:", error);
    }
  };

  const value = { currentPeriod, startDay, setStartDay };

  return <DateContext.Provider value={value}>{children}</DateContext.Provider>;
};

export const useDate = (): IDateContext => {
  const context = useContext(DateContext);
  if (context === undefined) {
    throw new Error('useDate must be used within a DateProvider');
  }
  return context;
};
