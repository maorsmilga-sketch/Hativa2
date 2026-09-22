import {
  collection,
  addDoc,
  doc,
  getDocs,
  getDoc,
  writeBatch,
  serverTimestamp,
  runTransaction,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { resolveTreatmentType } from '../constants/treatmentTypes';
import { generateTimeSlots } from './timeSlots';

const SHIFTS_COLLECTION = 'shifts';

function formatFirestoreError(err) {
  const code = err?.code || '';
  if (code === 'permission-denied') {
    return 'אין הרשאה ב-Firestore. העתיקו ופרסמו מחדש את firestore.rules מהפרויקט (Firebase Console → Rules → Publish).';
  }
  return err?.message || 'שגיאה ב-Firestore';
}

function buildShiftPayload(shiftData) {
  const {
    doctorName,
    treatmentCategory,
    treatmentOther,
    date,
    startTime,
    endTime,
    slotDuration,
    notes,
  } = shiftData;

  return {
    doctorName,
    treatmentType: resolveTreatmentType(treatmentCategory, treatmentOther),
    date,
    startTime,
    endTime,
    slotDuration: Number(slotDuration),
    notes: (notes || '').trim(),
  };
}

export async function createShiftWithAppointments(shiftData) {
  const payload = buildShiftPayload(shiftData);
  const { startTime, endTime, slotDuration } = payload;

  const slots = generateTimeSlots(startTime, endTime, slotDuration);

  if (slots.length === 0) {
    throw new Error('לא נוצרו משבצות — בדקו שעות התחלה/סיום ומשך המשבצת בטיפול');
  }

  const shiftRef = await addDoc(collection(db, SHIFTS_COLLECTION), {
    ...payload,
    createdAt: serverTimestamp(),
  });

  const batch = writeBatch(db);
  slots.forEach((slot) => {
    const appointmentRef = doc(collection(db, SHIFTS_COLLECTION, shiftRef.id, 'appointments'));
    batch.set(appointmentRef, slot);
  });
  await batch.commit();

  return shiftRef.id;
}

export async function fetchShifts() {
  const snapshot = await getDocs(collection(db, SHIFTS_COLLECTION));
  const shifts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  shifts.sort((a, b) => {
    const dateCmp = (a.date || '').localeCompare(b.date || '');
    if (dateCmp !== 0) return dateCmp;
    return (a.startTime || '').localeCompare(b.startTime || '');
  });
  return shifts;
}

export async function fetchShiftsWithAvailability() {
  const shifts = await fetchShifts();
  return Promise.all(
    shifts.map(async (shift) => {
      const appointments = await fetchAppointments(shift.id);
      const availableSlots = appointments.filter((a) => a.status === 'available').length;
      const totalSlots = appointments.length;
      return {
        ...shift,
        availableSlots,
        totalSlots,
        isFull: totalSlots > 0 && availableSlots === 0,
      };
    }),
  );
}

export async function countBookedAppointments(shiftId) {
  const appointments = await fetchAppointments(shiftId);
  return appointments.filter((a) => a.status === 'booked').length;
}

export async function updateShiftWithAppointments(shiftId, shiftData) {
  const payload = buildShiftPayload(shiftData);
  const bookedCount = await countBookedAppointments(shiftId);

  if (bookedCount > 0) {
    const currentSnap = await getDoc(doc(db, SHIFTS_COLLECTION, shiftId));
    const current = currentSnap.data() || {};
    try {
      await updateDoc(doc(db, SHIFTS_COLLECTION, shiftId), {
        doctorName: payload.doctorName,
        treatmentType: payload.treatmentType,
        date: payload.date,
        notes: payload.notes,
        startTime: current.startTime || payload.startTime,
        endTime: current.endTime || payload.endTime,
        slotDuration: Number(current.slotDuration ?? payload.slotDuration),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      throw new Error(formatFirestoreError(err));
    }
    return { scheduleLocked: true };
  }

  const appointments = await fetchAppointments(shiftId);
  const slots = generateTimeSlots(payload.startTime, payload.endTime, payload.slotDuration);
  if (slots.length === 0) {
    throw new Error('לא נוצרו משבצות — בדקו שעות ומשך משבצת');
  }

  const batch = writeBatch(db);
  appointments.forEach((apt) => {
    batch.delete(doc(db, SHIFTS_COLLECTION, shiftId, 'appointments', apt.id));
  });
  slots.forEach((slot) => {
    const appointmentRef = doc(collection(db, SHIFTS_COLLECTION, shiftId, 'appointments'));
    batch.set(appointmentRef, slot);
  });
  batch.update(doc(db, SHIFTS_COLLECTION, shiftId), {
    ...payload,
    updatedAt: serverTimestamp(),
  });
  try {
    await batch.commit();
  } catch (err) {
    throw new Error(formatFirestoreError(err));
  }
  return { scheduleLocked: false };
}

export async function deleteShift(shiftId) {
  const bookedCount = await countBookedAppointments(shiftId);
  if (bookedCount > 0) {
    throw new Error(
      'לא ניתן למחוק טיפול עם חיילים רשומים. ערכו את הטיפול או צרו טיפול חדש במקום.',
    );
  }

  const appointments = await fetchAppointments(shiftId);
  const batch = writeBatch(db);
  appointments.forEach((apt) => {
    batch.delete(doc(db, SHIFTS_COLLECTION, shiftId, 'appointments', apt.id));
  });
  batch.delete(doc(db, SHIFTS_COLLECTION, shiftId));
  try {
    await batch.commit();
  } catch (err) {
    throw new Error(formatFirestoreError(err));
  }
}

export async function fetchAppointments(shiftId) {
  const snapshot = await getDocs(
    collection(db, SHIFTS_COLLECTION, shiftId, 'appointments'),
  );
  const appointments = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  appointments.sort((a, b) => a.startTime.localeCompare(b.startTime));
  return appointments;
}

export async function fetchBookedRegistrants() {
  const shifts = await fetchShifts();
  const registrants = [];

  await Promise.all(
    shifts.map(async (shift) => {
      const appointments = await fetchAppointments(shift.id);
      appointments.forEach((apt) => {
        if (apt.status !== 'booked') return;
        registrants.push({
          ...apt,
          shiftId: shift.id,
          shiftDate: shift.date,
          doctorName: shift.doctorName,
          treatmentType: shift.treatmentType,
        });
      });
    }),
  );

  registrants.sort((a, b) => {
    const dateCmp = (a.shiftDate || '').localeCompare(b.shiftDate || '');
    if (dateCmp !== 0) return dateCmp;
    return (a.startTime || '').localeCompare(b.startTime || '');
  });

  return registrants;
}

export async function bookAppointment(shiftId, appointmentId, soldierDetails) {
  const appointmentRef = doc(
    db,
    SHIFTS_COLLECTION,
    shiftId,
    'appointments',
    appointmentId,
  );

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(appointmentRef);
    if (!snap.exists()) {
      throw new Error('המשבצת לא נמצאה');
    }
    const data = snap.data();
    if (data.status === 'booked') {
      throw new Error('המשבצת כבר תפוסה');
    }

    transaction.update(appointmentRef, {
      status: 'booked',
      personalNumber: soldierDetails.personalNumber,
      idNumber: soldierDetails.idNumber,
      battalion: soldierDetails.battalion,
      fullName: soldierDetails.fullName,
      phone: soldierDetails.phone,
      email: soldierDetails.email || '',
      bookedAt: serverTimestamp(),
    });
  });
}
