import React, { useEffect } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { IonApp, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

/* Core CSS e Tema */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import '../src/app/styles/variables.css';

/* Páginas e Layouts */
import { NotificationProvider } from './app/providers/NotificationContext';
import Login from './features/auth/pages/Login';
import ResetPassword from './features/auth/pages/ResetPassword';
import { AuthProvider } from './app/providers/AuthContext';
import { DateProvider } from './app/providers/DateContext';
import Register from './features/auth/pages/Register';
import MainLayout from './app/layouts/MainLayout';

setupIonicReact({
  mode: 'md'
});

const App: React.FC = () => {

  useEffect(() => {
    const initializeApp = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          await StatusBar.setOverlaysWebView({ overlay: true });
          await StatusBar.setBackgroundColor({ color: '#00000000' });
          await StatusBar.setStyle({ style: Style.Dark });
          console.log('Barra de Status configurada para o App.');
        } catch (error) {
          console.error('Erro ao configurar a Barra de Status:', error);
        }
      }
    };

    initializeApp();
  }, []);

  return (
    <IonApp>
      <IonReactRouter>
        <NotificationProvider>
          <AuthProvider>
            <DateProvider>
              <Switch>
                <Route path="/login" component={Login} exact />
                <Route path="/register" component={Register} exact />
                <Route path="/reset-password" component={ResetPassword} exact />
                <Route path="/app" component={MainLayout} />
                <Redirect exact from="/" to="/login" />
              </Switch>
            </DateProvider>
          </AuthProvider>
        </NotificationProvider>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;