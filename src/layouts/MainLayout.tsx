import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { IonRouterOutlet } from '@ionic/react';
import SideMenu from '../components/SideMenu';
import Dashboard from '../pages/Dashboard';


const MainLayout: React.FC = () => {
  return (
    <>
      <SideMenu contentId="main-app-content" />
      <IonRouterOutlet id="main-app-content">
        <Switch>
          <Route path="/app/dashboard" component={Dashboard} exact />
          <Redirect exact from="/app" to="/app/dashboard" />
          {/* Adicione outras rotas do seu app aqui, sempre com /app na frente */}
          {/* <Route path="/app/renda" component={Renda} exact /> */}
        </Switch>
      </IonRouterOutlet>
    </>
  );
};

export default MainLayout;