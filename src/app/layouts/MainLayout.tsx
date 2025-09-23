import React from 'react';
import { Redirect, Switch } from 'react-router-dom';
import { IonRouterOutlet } from '@ionic/react';
import SideMenu from '../../components/SideMenu';
import PrivateRoute from '../../components/PrivateRoute';
import Dashboard from '../../features/dashboard/pages/Dashboard';
import Renda from '../../features/transactions/pages/Renda';
import Despesas from '../../features/transactions/pages/Despesa';
import Reserva from '../../features/reserve/pages/Reserva';
import DefinirMetasPage from '../../features/goals_metas/pages/DefinirMetas';
import Cartao from '../../features/cards/pages/Cartao';
import Faturas from '../../features/transactions/pages/Faturas';
import Configuracao from '../../features/config/pages/Configuracao';

const MainLayout: React.FC = () => {
  return (
    <>
      <SideMenu contentId="main-app-content" />
      <IonRouterOutlet id="main-app-content">
        <Switch>
          <PrivateRoute path="/app/dashboard" component={Dashboard} exact />
          <PrivateRoute path="/app/renda" component={Renda} exact />
          <PrivateRoute path="/app/despesas" component={Despesas} exact />
          <PrivateRoute path="/app/reserva" component={Reserva} exact />
          <PrivateRoute path="/app/metas" component={DefinirMetasPage} exact />
          <PrivateRoute path="/app/cartao" component={Cartao} exact />
          <PrivateRoute path="/app/faturas" component={Faturas} exact />
          <PrivateRoute path="/app/configuracao" component={Configuracao} exact />
          <Redirect exact from="/app" to="/app/dashboard" />
        </Switch>
      </IonRouterOutlet>
    </>
  );
};

export default MainLayout;