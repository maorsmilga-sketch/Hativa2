import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';

const COLLECTION = 'routine_updates';

function formatFirestoreError(err) {
  const code = err?.code || '';
  if (code === 'permission-denied') {
    return 'אין הרשאה. ודאו ש-Rules ל-routine_updates פורסמו ב-Firebase.';
  }
  return err?.message || 'שגיאה ב-Firestore';
}

export async function fetchRoutineUpdates() {
  const snapshot = await getDocs(collection(db, COLLECTION));
  const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  items.sort((a, b) => {
    const orderA = a.sortOrder ?? 0;
    const orderB = b.sortOrder ?? 0;
    if (orderA !== orderB) return orderA - orderB;
    return (a.title || '').localeCompare(b.title || '', 'he');
  });
  return items;
}

export async function createRoutineUpdate({ title, description, sortOrder = 0 }) {
  const trimmedTitle = (title || '').trim();
  const trimmedDescription = (description || '').trim();
  if (!trimmedTitle) throw new Error('יש להזין כותרת / תחום');
  if (!trimmedDescription) throw new Error('יש להזין תיאור');

  try {
    const ref = await addDoc(collection(db, COLLECTION), {
      title: trimmedTitle,
      description: trimmedDescription,
      sortOrder: Number(sortOrder) || 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  } catch (err) {
    throw new Error(formatFirestoreError(err));
  }
}

export async function updateRoutineUpdate(id, { title, description, sortOrder = 0 }) {
  const trimmedTitle = (title || '').trim();
  const trimmedDescription = (description || '').trim();
  if (!trimmedTitle) throw new Error('יש להזין כותרת / תחום');
  if (!trimmedDescription) throw new Error('יש להזין תיאור');

  try {
    await updateDoc(doc(db, COLLECTION, id), {
      title: trimmedTitle,
      description: trimmedDescription,
      sortOrder: Number(sortOrder) || 0,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    throw new Error(formatFirestoreError(err));
  }
}

export async function deleteRoutineUpdate(id) {
  try {
    await deleteDoc(doc(db, COLLECTION, id));
  } catch (err) {
    throw new Error(formatFirestoreError(err));
  }
}
