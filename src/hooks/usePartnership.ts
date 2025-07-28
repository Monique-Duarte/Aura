import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getFirestore, collection, query, where, onSnapshot, doc, getDoc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';
import app from '../firebaseConfig';

// Define os possíveis estados de um vínculo
export type PartnershipStatus = 'unlinked' | 'pending_sent' | 'pending_received' | 'linked';

export interface Partnership {
  id: string;
  members: string[];
  requesterId: string;
  inviteCode?: string;
  partnerEmail?: string;
  partnerDisplayName?: string;
}

export const usePartnership = () => {
  const { user } = useAuth();
  const [partnership, setPartnership] = useState<Partnership | null>(null);
  const [status, setStatus] = useState<PartnershipStatus>('unlinked');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPartnership(null);
      setStatus('unlinked');
      setLoading(false);
      return;
    }

    const db = getFirestore(app);
    const partnershipsRef = collection(db, 'partnerships');
    const q = query(partnershipsRef, where('members', 'array-contains', user.uid));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        setPartnership(null);
        setStatus('unlinked');
      } else {
        // CORREÇÃO: Renomeado 'doc' para 'partnershipDoc' para evitar conflito
        const partnershipDoc = snapshot.docs[0];
        const data = partnershipDoc.data();
        const partnerId = data.members.find((id: string) => id !== user.uid);
        
        // Busca os dados do parceiro para exibir na UI
        const partnerDocRef = doc(db, 'users', partnerId);
        const partnerDocSnap = await getDoc(partnerDocRef);
        const partnerData = partnerDocSnap.data();

        const p: Partnership = {
          id: partnershipDoc.id,
          members: data.members,
          requesterId: data.requesterId,
          inviteCode: data.inviteCode,
          partnerEmail: partnerData?.email,
          partnerDisplayName: partnerData?.displayName,
        };
        setPartnership(p);

        if (data.status === 'active') {
          setStatus('linked');
        } else if (data.requesterId === user.uid) {
          setStatus('pending_sent');
        } else {
          setStatus('pending_received');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const sendInvite = async (partnerEmail: string) => {
    if (!user || !partnerEmail) return;
    
    const db = getFirestore(app);
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', partnerEmail));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("Utilizador não encontrado com este e-mail.");
    }
    const partnerId = querySnapshot.docs[0].id;
    if (partnerId === user.uid) {
      throw new Error("Não pode convidar a si mesmo.");
    }

    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // CORREÇÃO: A referência ao documento deve ser criada antes do setDoc
    const newPartnershipRef = doc(collection(db, 'partnerships'));
    const partnershipData = {
      members: [user.uid, partnerId],
      requesterId: user.uid,
      status: 'pending',
      inviteCode: inviteCode,
      createdAt: new Date(),
    };
    await setDoc(newPartnershipRef, partnershipData);
  };

  const acceptInvite = async (inviteCode: string) => {
    if (!user || !partnership) return;
    if (partnership.inviteCode === inviteCode) {
        const db = getFirestore(app);
        const partnershipDocRef = doc(db, 'partnerships', partnership.id);
        await setDoc(partnershipDocRef, { status: 'active' }, { merge: true });
    } else {
        throw new Error("Código de convite inválido.");
    }
  };

  const cancelPartnership = async () => {
    if (!partnership) return;
    const db = getFirestore(app);
    const partnershipDocRef = doc(db, 'partnerships', partnership.id);
    await deleteDoc(partnershipDocRef);
  };

  return { partnership, status, loading, sendInvite, acceptInvite, cancelPartnership };
};