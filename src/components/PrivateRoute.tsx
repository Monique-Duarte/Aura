import React from 'react';
import { Redirect, Route, RouteProps, RouteComponentProps } from 'react-router-dom';
import { useAuth } from '../hooks/AuthContext';
import { IonSpinner, IonPage, IonContent } from '@ionic/react';

interface PrivateRouteProps extends RouteProps {
  component: React.ComponentType<RouteComponentProps>;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ component: Component, ...rest }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <IonPage>
        <IonContent className="ion-padding" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <IonSpinner name="crescent" />
        </IonContent>
      </IonPage>
    );
  }

  return (
    <Route
      {...rest}
      render={props =>
        user ? (
          <Component {...props} />
        ) : (
          <Redirect to="/login" />
        )
      }
    />
  );
};

export default PrivateRoute;