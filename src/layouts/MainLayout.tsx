import React from 'react';
import { Redirect, Switch } from 'react-router-dom';
import { IonRouterOutlet } from '@ionic/react';
import SideMenu from '../components/SideMenu';
import PrivateRoute from '../components/PrivateRoute';
import Dashboard from '../pages/Dashboard';
import Renda from '../pages/Renda';
import Despesa from '../pages/Despesa';
import Reserva from '../pages/Reserva';
import Cartao from '../pages/Cartao';
import Faturas from '../pages/Faturas';
import Configuracao from '../pages/Configuracao';

const MainLayout: React.FC = () => {
  return (
    <>
      <SideMenu contentId="main-app-content" />
      <IonRouterOutlet id="main-app-content">
        <Switch>
          <PrivateRoute path="/app/dashboard" component={Dashboard} exact />
          <PrivateRoute path="/app/renda" component={Renda} exact />
          <PrivateRoute path="/app/despesas" component={Despesa} exact />
          <PrivateRoute path="/app/reserva" component={Reserva} exact />
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