import React, { useState, useEffect, useRef } from 'react';
import {
  IonMenu, IonHeader, IonTitle, IonContent, IonList, IonItem,
  IonMenuToggle, IonIcon, IonLabel, IonAvatar, IonFooter,
  IonNote, IonSpinner, useIonToast, IonToolbar
} from '@ionic/react';
import {
  cashOutline, cardOutline, walletOutline, homeOutline, receiptOutline,
  logOutOutline, personCircleOutline, settingsOutline, documentTextOutline, flagOutline
} from 'ionicons/icons';
// CORREÇÃO: Voltamos a usar useHistory, que é compatível com sua versão.
import { useLocation, useHistory } from 'react-router-dom';
import { getAuth, signOut, onAuthStateChanged, User, updateProfile } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import '../theme/variables.css';
import { APP_VERSION } from '../constants';

const menuGroups = [
  {
    groupName: 'Financeiro',
    options: [
      { title: 'Dashboard', icon: homeOutline, path: '/app/dashboard' },
      { title: 'Renda', icon: cashOutline, path: '/app/renda' },
      { title: 'Despesas', icon: receiptOutline, path: '/app/despesas' },
      { title: 'Reserva', icon: walletOutline, path: '/app/reserva' },
    ]
  },
  {
    groupName: 'Cartões e Metas',
    options: [
      { title: 'Cartão', icon: cardOutline, path: '/app/cartao' },
      { title: 'Faturas', icon: documentTextOutline, path: '/app/faturas' },
      { title: 'Definir Metas', icon: flagOutline, path: '/app/metas' },
    ]
  },
  {
    groupName: 'Conta',
    options: [
      { title: 'Configurações', icon: settingsOutline, path: '/app/configuracao' },
    ]
  }
];

const SideMenu: React.FC<{ contentId: string }> = ({ contentId }) => {
  const history = useHistory();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [present] = useIonToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      history.push('/login');
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    const storage = getStorage();
    const auth = getAuth();
    const storageRef = ref(storage, `profile_pictures/${user.uid}`);

    try {
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL });
      }
      setUser(prevUser => prevUser ? { ...prevUser, photoURL } : null);
      present({ message: 'Foto de perfil atualizada!', duration: 2000, color: 'success', position: 'top' });
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error);
      present({ message: 'Erro ao atualizar a foto.', duration: 2500, color: 'danger', position: 'top' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <IonMenu contentId={contentId} type="overlay">
      <IonHeader translucent={true} className="ion-no-border">
        <IonToolbar>
          <div className="user-profile">
            <IonAvatar onClick={handleAvatarClick} className="user-avatar">
              {isUploading ? (
                <IonSpinner name="crescent" />
              ) : user?.photoURL ? (
                <img src={user.photoURL} alt="Avatar" />
              ) : (
                <IonIcon icon={personCircleOutline} className="generic-avatar-icon" />
              )}
            </IonAvatar>
            <input
              type="file"
              accept="image/png, image/jpeg"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <IonTitle>Olá, {user?.displayName || 'Usuário'}</IonTitle>
            <IonNote>{user?.email}</IonNote>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen={true}>
        <IonList id="menu-list">
          {menuGroups.map(group => (
            <React.Fragment key={group.groupName}>
              <IonItem lines="none" className="menu-group-header">
                <IonLabel color="medium">{group.groupName}</IonLabel>
              </IonItem>
              {group.options.map(option => (
                <IonMenuToggle key={option.title} autoHide={false}>
                  <IonItem
                    button
                    // CORREÇÃO: A chamada de navegação agora usa history.push()
                    onClick={() => history.push(option.path)}
                    className={location.pathname === option.path ? 'selected' : ''}
                    lines="none"
                  >
                    <IonIcon slot="start" icon={option.icon} />
                    <IonLabel>{option.title}</IonLabel>
                  </IonItem>
                </IonMenuToggle>
              ))}
            </React.Fragment>
          ))}
        </IonList>
      </IonContent>

      <IonFooter className="ion-no-border">
        <IonList>
          <IonMenuToggle autoHide={false}>
            <IonItem button lines="none" onClick={handleLogout}>
              <IonIcon slot="start" icon={logOutOutline} />
              <IonLabel>Sair</IonLabel>
            </IonItem>
          </IonMenuToggle>
        </IonList>
        <div className="ion-text-center ion-padding-bottom">
          <IonNote color="medium">{APP_VERSION}</IonNote>
        </div>
      </IonFooter>
    </IonMenu>
  );
};

export default SideMenu;