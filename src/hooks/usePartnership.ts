import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext'; // Ajuste o caminho se necessário
import {
  getFirestore,
  collection,
  query,
  where,
  addDoc,
  doc,
  updateDoc,
  getDocs,
  serverTimestamp,
  deleteDoc,
  FieldValue,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import app from '../firebaseConfig'; // Ajuste o caminho se necessário

export interface PartnershipDoc {
  members: string[];
  memberDetails: {
    [uid: string]: {
      email: string;
      displayName: string;
    };
  };
  requesterId: string;
  status: 'pending' | 'accepted';
  createdAt: FieldValue | Timestamp;
}

export interface Partnership extends PartnershipDoc {
  id: string;
  partnerId?: string;
  partnerEmail?: string;
  partnerDisplayName?: string;
}

export const usePartnership = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activePartnership, setActivePartnership] = useState<Partnership | null>(null);
  const [pendingInvitations, setPendingInvitations] = useState<Partnership[]>([]);
  const [sentInvitation, setSentInvitation] = useState<Partnership | null>(null);

  // Efeito que "escuta" por mudanças em tempo real na coleção 'partnerships'.
  useEffect(() => {
    if (!user) {
      setLoading(false);
      setActivePartnership(null);
      setPendingInvitations([]);
      setSentInvitation(null);
      return;
    }

    setLoading(true);
    const db = getFirestore(app);
    const partnershipsRef = collection(db, 'partnerships');
    const q = query(partnershipsRef, where('members', 'array-contains', user.uid));

    // onSnapshot cria um listener que atualiza a tela automaticamente quando há mudanças.
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let active: Partnership | null = null;
        const received: Partnership[] = [];
        let sent: Partnership | null = null;

        snapshot.docs.forEach((docSnapshot) => {
          const data = docSnapshot.data() as PartnershipDoc;
          const id = docSnapshot.id;
          const partnerId = data.members.find((uid) => uid !== user.uid);
          const partnerDetails =
            partnerId && data.memberDetails ? data.memberDetails[partnerId] : null;

          const partnershipData: Partnership = {
            ...data,
            id,
            partnerId,
            partnerEmail: partnerDetails?.email || 'Parceiro(a)',
            partnerDisplayName: partnerDetails?.displayName || 'Parceiro(a)',
          };

          if (data.status === 'accepted') {
            active = partnershipData;
          } else if (data.status === 'pending') {
            if (data.requesterId === user.uid) {
              sent = partnershipData;
            } else {
              received.push(partnershipData);
            }
          }
        });

        setActivePartnership(active);
        setPendingInvitations(received);
        setSentInvitation(sent);
        setLoading(false);
      },
      (error) => {
        console.error('[usePartnership] Erro no listener do Firestore:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const sendInvitation = useCallback(
    async (receiverEmail: string) => {
      try {
        if (!user || !user.email || !user.displayName) {
          throw new Error('Usuário não autenticado ou sem e-mail/nome de exibição.');
        }
        if (user.email.toLowerCase() === receiverEmail.toLowerCase()) {
          throw new Error('Você não pode convidar a si mesmo.');
        }
        if (activePartnership || sentInvitation || pendingInvitations.length > 0) {
          throw new Error('Você já possui um vínculo ou convite pendente.');
        }

        const db = getFirestore(app);
        const usersRef = collection(db, 'users');
        const qUser = query(usersRef, where('email', '==', receiverEmail.toLowerCase()));
        const userSnapshot = await getDocs(qUser);

        if (userSnapshot.empty) {
          throw new Error('Nenhum usuário encontrado com este e-mail.');
        }

        const receiverDoc = userSnapshot.docs[0];
        const receiverData = receiverDoc.data();

        if (!receiverData.email || !receiverData.displayName) {
          throw new Error('O usuário encontrado não possui e-mail ou nome de exibição.');
        }

        const newInvitation: PartnershipDoc = {
          members: [user.uid, receiverDoc.id],
          memberDetails: {
            [user.uid]: {
              email: user.email,
              displayName: user.displayName,
            },
            [receiverDoc.id]: {
              email: receiverData.email,
              displayName: receiverData.displayName,
            },
          },
          requesterId: user.uid,
          status: 'pending',
          createdAt: serverTimestamp(),
        };

        await addDoc(collection(db, 'partnerships'), newInvitation);
      } catch (error) {
        console.error('[sendInvitation] Erro ao enviar convite:', error);
        throw error;
      }
    },
    [user, activePartnership, sentInvitation, pendingInvitations]
  );

  const acceptInvitation = useCallback(async (invitationId: string) => {
    const db = getFirestore(app);
    const invitationRef = doc(db, 'partnerships', invitationId);
    await updateDoc(invitationRef, { status: 'accepted' });
  }, []);

  const cancelOrDecline = useCallback(async (partnershipId: string) => {
    const db = getFirestore(app);
    await deleteDoc(doc(db, 'partnerships', partnershipId));
  }, []);

  return {
    loading,
    activePartnership,
    pendingInvitations,
    sentInvitation,
    sendInvitation,
    acceptInvitation,
    cancelOrDecline,
  };
};
