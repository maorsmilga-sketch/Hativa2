import { collection, doc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

export const PRIVATE_BOOKINGS_COLLECTION = 'private_bookings';

export function privateBookingDocId(shiftId, slotId) {
  return `${shiftId}_${slotId}`;
}

export function privateBookingRef(shiftId, slotId) {
  return doc(db, PRIVATE_BOOKINGS_COLLECTION, privateBookingDocId(shiftId, slotId));
}

export function buildPrivateBookingPayload(shiftId, slotId, soldierDetails) {
  return {
    shiftId,
    slotId,
    personalNumber: soldierDetails.personalNumber,
    soldierName: soldierDetails.fullName,
    phone: soldierDetails.phone,
    email: soldierDetails.email || '',
    idNumber: soldierDetails.idNumber,
    battalion: soldierDetails.battalion,
  };
}

/** Map slotId → private booking document */
export async function fetchPrivateBookingsByShiftId(shiftId) {
  const q = query(
    collection(db, PRIVATE_BOOKINGS_COLLECTION),
    where('shiftId', '==', shiftId),
  );
  const snapshot = await getDocs(q);
  const map = new Map();
  snapshot.docs.forEach((d) => {
    const data = d.data();
    map.set(data.slotId || d.id.split('_').pop(), { id: d.id, ...data });
  });
  return map;
}

export async function fetchAllPrivateBookings() {
  const snapshot = await getDocs(collection(db, PRIVATE_BOOKINGS_COLLECTION));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Attach PII from private_bookings (or legacy fields on the appointment doc for admin).
 */
export function enrichAppointmentWithPrivate(apt, privateBySlotId) {
  const pb = privateBySlotId?.get(apt.id);
  if (pb) {
    return {
      ...apt,
      personalNumber: pb.personalNumber,
      fullName: pb.soldierName || pb.fullName || '',
      phone: pb.phone || '',
      email: pb.email || '',
      idNumber: pb.idNumber || '',
      battalion: pb.battalion || '',
      privateBookingId: pb.id,
    };
  }
  return apt;
}
