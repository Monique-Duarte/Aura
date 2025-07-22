import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { calculateFinancialPeriod } from '../logic/dateLogic';

interface IDatePeriod {
  startDate: Date;
  endDate: Date;
}

interface IDateContext {
  currentPeriod: IDatePeriod;
  startDay: number;
  setStartDay: (day: number) => void;
}

// Cria o contexto com um valor padrão inicial
const DateContext = createContext<IDateContext | undefined>(undefined);

// O componente Provedor
export const DateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // O padrão é o dia 1, mas buscaremos do Firestore/localStorage
  const [startDay, setStartDayState] = useState<number>(1);
  const [currentPeriod, setCurrentPeriod] = useState<IDatePeriod>(calculateFinancialPeriod(1));

  // Simulação: buscar a configuração do usuário ao carregar o app
  useEffect(() => {
    // EM PRODUÇÃO: Aqui você faria uma chamada ao Firestore para buscar a preferência do usuário.
    // Ex: const userPref = await getUserPreferences(auth.currentUser.uid);
    // Por enquanto, vamos usar localStorage como exemplo.
    const savedDay = localStorage.getItem('financialStartDay');
    const day = savedDay ? parseInt(savedDay, 10) : 1;
    setStartDayState(day);
  }, []);

  // Recalcula o período sempre que o startDay mudar
  useEffect(() => {
    setCurrentPeriod(calculateFinancialPeriod(startDay));
  }, [startDay]);

  // Função para o usuário atualizar sua preferência
  const setStartDay = (day: number) => {
    // EM PRODUÇÃO: Salvar no Firestore
    // Ex: await saveUserPreference(auth.currentUser.uid, { startDay: day });
    localStorage.setItem('financialStartDay', day.toString());
    setStartDayState(day);
  };

  const value = { currentPeriod, startDay, setStartDay };

  return <DateContext.Provider value={value}>{children}</DateContext.Provider>;
};

// O Hook customizado para facilitar o uso
export const useDate = (): IDateContext => {
  const context = useContext(DateContext);
  if (context === undefined) {
    throw new Error('useDate must be used within a DateProvider');
  }
  return context;
};
