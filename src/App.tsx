import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { IonApp, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

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

setupIonicReact();

const App: React.FC = () => (
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

export default App;