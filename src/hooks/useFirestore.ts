import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, QueryConstraint, getFirestore } from 'firebase/firestore';
import { auth } from '@/lib/firebase';

// Generic hook to listen to a user's subcollection in Firestore (e.g., 'expenses', 'budgets')
export function useFirestore<T = any>(subcollection: string, constraints: QueryConstraint[] = []) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!auth) {
      setError(new Error('Firebase auth is not initialized.'));
      setLoading(false);
      return;
    }
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      if (!user) {
        setData([]);
        setLoading(false);
        return;
      }
      const db = getFirestore();
      const ref = collection(db, 'users', user.uid, subcollection);
      const q = constraints.length ? query(ref, ...constraints) : query(ref);
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as T));
        setLoading(false);
      }, err => {
        setError(err);
        setLoading(false);
      });
      return unsubscribe;
    });
    return () => unsubscribeAuth();
  }, [subcollection, ...constraints]);

  return { data, loading, error };
}
