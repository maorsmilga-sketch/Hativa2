/** Local calendar date YYYY-MM-DD in Israel */
export function getIsraelLocalDateString(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

function getIsraelLocalTimeHHMM(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jerusalem',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const hour = parts.find((p) => p.type === 'hour')?.value ?? '00';
  const minute = parts.find((p) => p.type === 'minute')?.value ?? '00';
  return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
}

/** Shifts soldiers can still book (today until end time; future dates). */
export function isShiftOpenForBooking(shift, now = new Date()) {
  const today = getIsraelLocalDateString(now);
  const date = shift.date || '';
  if (!date) return false;
  if (date > today) return true;
  if (date < today) return false;
  const endTime = shift.endTime || '23:59';
  return endTime > getIsraelLocalTimeHHMM(now);
}

export function filterShiftsOpenForBooking(shifts, now = new Date()) {
  return shifts.filter((shift) => isShiftOpenForBooking(shift, now));
}
