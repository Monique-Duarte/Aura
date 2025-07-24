import React from 'react';
import { Redirect, Switch } from 'react-router-dom';
import { IonRouterOutlet } from '@ionic/react';
import SideMenu from '../components/SideMenu';
import PrivateRoute from '../components/PrivateRoute';
import Dashboard from '../pages/Dashboard';
import Renda from '../pages/Renda';
import Gastos from '../pages/Gastos';
import Reserva from '../pages/Reserva';

const MainLayout: React.FC = () => {
  return (
    <>
      <SideMenu contentId="main-app-content" />
      <IonRouterOutlet id="main-app-content">
        <Switch>
          <PrivateRoute path="/app/dashboard" component={Dashboard} exact />
          <PrivateRoute path="/app/renda" component={Renda} exact />
          <PrivateRoute path="/app/gastos" component={Gastos} exact />
          <PrivateRoute path="/app/reserva" component={Reserva} exact />
          {/* Adicione outras rotas privadas aqui */}
          <Redirect exact from="/app" to="/app/dashboard" />
        </Switch>
      </IonRouterOutlet>
    </>
  );
};

export default MainLayout;