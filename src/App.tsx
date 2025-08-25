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

const App: React.FC = () => {

  useEffect(() => {
    // Esta função será chamada uma única vez quando o app iniciar.
    const initializeApp = async () => {
      // Só executa em dispositivos móveis.
      if (Capacitor.isNativePlatform()) {
        try {
          // 1. Sobrepõe o app: Essencial para o nosso layout de tela cheia.
          await StatusBar.setOverlaysWebView({ overlay: true });

          // 2. Deixa o fundo da barra transparente para mostrar a cor do nosso header.
          await StatusBar.setBackgroundColor({ color: '#00000000' }); // Transparente

          // 3. Define os ícones (hora, bateria) para um tom escuro, que contrasta bem com seu header amarelo.
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