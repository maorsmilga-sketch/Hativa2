import {
  collection,
  addDoc,
  doc,
  getDocs,
  writeBatch,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { generateTimeSlots } from './timeSlots';

const SHIFTS_COLLECTION = 'shifts';

export async function createShiftWithAppointments(shiftData) {
  const { doctorName, treatmentType, date, startTime, endTime, slotDuration } =
    shiftData;

  const slots = generateTimeSlots(startTime, endTime, Number(slotDuration));

  if (slots.length === 0) {
    throw new Error('לא נוצרו משבצות — בדקו את שעות ההתחלה/סיום והמשך המשבצת');
  }

  const shiftRef = await addDoc(collection(db, SHIFTS_COLLECTION), {
    doctorName,
    treatmentType,
    date,
    startTime,
    endTime,
    slotDuration: Number(slotDuration),
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
