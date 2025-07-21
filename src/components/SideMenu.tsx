import React from 'react';
import {
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonMenuToggle,
  IonIcon
} from '@ionic/react';
import { cashOutline, cardOutline, trendingUpOutline, walletOutline, homeOutline, receiptOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';

const menuOptions = [
  { title: 'Dashboard', icon: homeOutline, path: '/dashboard' },
  { title: 'Renda', icon: cashOutline, path: '/renda' },
  { title: 'Gastos', icon: cardOutline, path: '/gastos' },
  { title: 'Faturas', icon: receiptOutline, path: '/faturas' },
  { title: 'Reserva', icon: walletOutline, path: '/reserva' },
  { title: 'Investimentos', icon: trendingUpOutline, path: '/investimentos' },
];

const SideMenu: React.FC<{ contentId: string }> = ({ contentId }) => {
  const history = useHistory();
  return (
    <IonMenu contentId={contentId} type="overlay">
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Menu</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList>
          {menuOptions.map(option => (
            <IonMenuToggle key={option.title} autoHide={false}>
              <IonItem button onClick={() => history.push(option.path)}>
                <IonIcon slot="start" icon={option.icon} />
                {option.title}
              </IonItem>
            </IonMenuToggle>
          ))}
        </IonList>
      </IonContent>
    </IonMenu>
  );
};

export default SideMenu; 