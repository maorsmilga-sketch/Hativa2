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
  setDoc,
  deleteDoc,
  deleteField,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  PRIVATE_BOOKINGS_COLLECTION,
  buildPrivateBookingPayload,
  enrichAppointmentWithPrivate,
  fetchAllPrivateBookings,
  fetchPrivateBookingsByShiftId,
  privateBookingRef,
} from './privateBookings';
import { resolveTreatmentType } from '../constants/treatmentTypes';
import { normalizeBreaks } from './breaks';
import { listWeeklyOccurrenceDates } from './recurrence';
import { filterShiftsOpenForBooking } from './shiftSchedule';
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
    breaks,
    location,
  } = shiftData;

  return {
    doctorName,
    treatmentType: resolveTreatmentType(treatmentCategory, treatmentOther),
    date,
    startTime,
    endTime,
    slotDuration: Number(slotDuration),
    notes: (notes || '').trim(),
    location: (location || '').trim(),
    breaks: normalizeBreaks(breaks),
  };
}

export async function createShiftWithAppointments(shiftData, recurrenceMeta = null) {
  const payload = buildShiftPayload(shiftData);
  const { startTime, endTime, slotDuration } = payload;

  const slots = generateTimeSlots(startTime, endTime, slotDuration, payload.breaks);

  if (slots.length === 0) {
    throw new Error('לא נוצרו משבצות — בדקו שעות התחלה/סיום ומשך המשבצת בטיפול');
  }

  const shiftRef = await addDoc(collection(db, SHIFTS_COLLECTION), {
    ...payload,
    ...(recurrenceMeta || {}),
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

export async function createShiftsFromForm(formData) {
  const {
    recurrenceEnabled,
    recurrenceWeekday,
    recurrenceUntil,
    ...baseForm
  } = formData;

  if (!recurrenceEnabled) {
    const id = await createShiftWithAppointments(baseForm);
    return { count: 1, ids: [id] };
  }

  if (!recurrenceUntil) {
    throw new Error('יש לבחור תאריך סיום לטיפול המחזורי');
  }

  const dates = listWeeklyOccurrenceDates(baseForm.date, recurrenceUntil, recurrenceWeekday);
  const groupId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `rec-${Date.now()}`;

  const meta = {
    recurrenceGroupId: groupId,
    recurrenceWeekday,
    recurrenceUntil,
    isRecurring: true,
  };

  const ids = [];
  for (const date of dates) {
    const id = await createShiftWithAppointments({ ...baseForm, date }, meta);
    ids.push(id);
  }

  return { count: ids.length, ids, dates };
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
  const shifts = filterShiftsOpenForBooking(await fetchShifts());
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
        location: payload.location,
        breaks: normalizeBreaks(current.breaks || payload.breaks),
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
  const slots = generateTimeSlots(
    payload.startTime,
    payload.endTime,
    payload.slotDuration,
    payload.breaks,
  );
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

export async function updateRecurringFutureShifts(editedShift, shiftData) {
  if (!editedShift?.recurrenceGroupId) {
    return { futureUpdated: 0 };
  }

  const all = await fetchShifts();
  const futureShifts = all.filter(
    (s) =>
      s.recurrenceGroupId === editedShift.recurrenceGroupId &&
      s.id !== editedShift.id &&
      (s.date || '') > (editedShift.date || ''),
  );

  for (const shift of futureShifts) {
    await updateShiftWithAppointments(shift.id, {
      ...shiftData,
      date: shift.date,
    });
  }

  return { futureUpdated: futureShifts.length };
}

export async function deleteShift(shiftId) {
  const bookedCount = await countBookedAppointments(shiftId);
  if (bookedCount > 0) {
    throw new Error(
      'לא ניתן למחוק טיפול עם חיילים רשומים. ערכו את הטיפול או צרו טיפול חדש במקום.',
    );
  }

  const appointments = await fetchAppointments(shiftId);
  const privateMap = await fetchPrivateBookingsByShiftId(shiftId);
  const batch = writeBatch(db);
  appointments.forEach((apt) => {
    batch.delete(doc(db, SHIFTS_COLLECTION, shiftId, 'appointments', apt.id));
    const pb = privateMap.get(apt.id);
    if (pb?.id) {
      batch.delete(doc(db, PRIVATE_BOOKINGS_COLLECTION, pb.id));
    }
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
  const shiftById = new Map(shifts.map((s) => [s.id, s]));
  const privateBookings = await fetchAllPrivateBookings();
  const registrants = [];

  privateBookings.forEach((pb) => {
    const shift = shiftById.get(pb.shiftId);
    if (!shift) return;
    registrants.push({
      id: pb.slotId,
      shiftId: pb.shiftId,
      shiftDate: shift.date,
      doctorName: shift.doctorName,
      treatmentType: shift.treatmentType,
      startTime: pb.startTime || '',
      endTime: pb.endTime || '',
      personalNumber: pb.personalNumber,
      fullName: pb.soldierName || pb.fullName || '',
      phone: pb.phone,
      email: pb.email,
      idNumber: pb.idNumber,
      battalion: pb.battalion,
      status: 'booked',
    });
  });

  await Promise.all(
    shifts.map(async (shift) => {
      const appointments = await fetchAppointments(shift.id);
      const privateMap = await fetchPrivateBookingsByShiftId(shift.id);
      appointments.forEach((apt) => {
        if (apt.status !== 'booked') return;
        if (privateMap.has(apt.id)) return;
        registrants.push({
          ...enrichAppointmentWithPrivate(apt, privateMap),
          shiftId: shift.id,
          shiftDate: shift.date,
          doctorName: shift.doctorName,
          treatmentType: shift.treatmentType,
        });
      });
    }),
  );

  await Promise.all(
    registrants.map(async (entry) => {
      if (entry.startTime) return;
      const appointments = await fetchAppointments(entry.shiftId);
      const apt = appointments.find((a) => a.id === entry.id);
      if (apt) {
        entry.startTime = apt.startTime;
        entry.endTime = apt.endTime;
      }
    }),
  );

  registrants.sort((a, b) => {
    const dateCmp = (a.shiftDate || '').localeCompare(b.shiftDate || '');
    if (dateCmp !== 0) return dateCmp;
    return (a.startTime || '').localeCompare(b.startTime || '');
  });

  return registrants;
}

/** Admin: public slots joined with private_bookings PII */
export async function fetchShiftScheduleWithPrivate(shiftId) {
  const [appointments, privateMap] = await Promise.all([
    fetchAppointments(shiftId),
    fetchPrivateBookingsByShiftId(shiftId),
  ]);
  return appointments.map((apt) => enrichAppointmentWithPrivate(apt, privateMap));
}

export async function updateBookedAppointment(shiftId, appointmentId, soldierDetails) {
  const bookingRef = privateBookingRef(shiftId, appointmentId);

  try {
    await setDoc(
      bookingRef,
      {
        ...buildPrivateBookingPayload(shiftId, appointmentId, soldierDetails),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (err) {
    throw new Error(formatFirestoreError(err));
  }
}

export async function cancelBookedAppointment(shiftId, appointmentId) {
  const appointmentRef = doc(
    db,
    SHIFTS_COLLECTION,
    shiftId,
    'appointments',
    appointmentId,
  );
  const bookingRef = privateBookingRef(shiftId, appointmentId);

  try {
    await runTransaction(db, async (transaction) => {
      const pbSnap = await transaction.get(bookingRef);
      transaction.update(appointmentRef, {
        status: 'available',
        personalNumber: deleteField(),
        idNumber: deleteField(),
        battalion: deleteField(),
        fullName: deleteField(),
        phone: deleteField(),
        email: deleteField(),
        bookedAt: deleteField(),
      });
      if (pbSnap.exists()) {
        transaction.delete(bookingRef);
      }
    });
  } catch (err) {
    throw new Error(formatFirestoreError(err));
  }
}

export async function bookAppointment(shiftId, appointmentId, soldierDetails) {
  const appointmentRef = doc(
    db,
    SHIFTS_COLLECTION,
    shiftId,
    'appointments',
    appointmentId,
  );
  const bookingRef = privateBookingRef(shiftId, appointmentId);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(appointmentRef);
    if (!snap.exists()) {
      throw new Error('המשבצת לא נמצאה');
    }
    const data = snap.data();
    if (data.status === 'booked') {
      throw new Error('המשבצת כבר תפוסה');
    }

    transaction.update(appointmentRef, { status: 'booked' });
    transaction.set(bookingRef, {
      ...buildPrivateBookingPayload(shiftId, appointmentId, soldierDetails),
      startTime: data.startTime,
      endTime: data.endTime,
      bookedAt: serverTimestamp(),
    });
  });
}
