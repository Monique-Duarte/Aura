import React, { useEffect } from 'react';
import { Redirect, Route, Switch, useHistory } from 'react-router-dom';
import { IonApp, setupIonicReact, isPlatform } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

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
import './theme/variables.css';

/* Páginas e Layouts */
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import MainLayout from './layouts/MainLayout';
import { DateProvider } from './hooks/DateContext';
import { AuthProvider } from './hooks/AuthContext';

setupIonicReact({
  mode: 'md'
});

// Componente para monitorar mudanças de rota e reconfigurar StatusBar
const StatusBarManager: React.FC = () => {
  const history = useHistory();

  useEffect(() => {
    const configureStatusBar = async () => {
      if (!Capacitor.isNativePlatform()) return;

      try {
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: '#00000000' });
        await StatusBar.show();
        await StatusBar.setOverlaysWebView({ overlay: false });
        console.log('StatusBar reconfigurada na rota:', history.location.pathname);
      } catch (error) {
        console.log('Erro ao configurar StatusBar:', error);
      }
    };

    // Configura imediatamente
    configureStatusBar();

    // Reconfigura sempre que a rota mudar
    const unlisten = history.listen(() => {
      setTimeout(configureStatusBar, 100);
    });

    return unlisten;
  }, [history]);

  return null;
};

const App: React.FC = () => {
  useEffect(() => {
    const configureStatusBar = async () => {
      // Verifica se está rodando em um dispositivo nativo
      if (!Capacitor.isNativePlatform()) {
        console.log('StatusBar não disponível na web/browser');
        return;
      }

      try {
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: '#00000000' });
        await StatusBar.show();
        
        if (isPlatform('android')) {
          const userAgent = navigator.userAgent;
          const isSamsung = userAgent.includes('SM-') || userAgent.includes('Samsung');
          
          if (isSamsung) {
            await StatusBar.setOverlaysWebView({ overlay: true });
            console.log('Configuração Samsung aplicada');
          } else {
            await StatusBar.setOverlaysWebView({ overlay: false });
            console.log('Configuração Android padrão aplicada');
          }
        } else {
          await StatusBar.setOverlaysWebView({ overlay: false });
        }
        
      } catch (error) {
        console.log('StatusBar não disponível na web/browser:', error);
      }
    };

    configureStatusBar();
  }, []);

  return (
    <IonApp>
      <IonReactRouter>
        <StatusBarManager />
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
      </IonReactRouter>
    </IonApp>
  );
};

export default App;