/** JS Date.getDay(): 0=Sunday … 6=Saturday (Israeli calendar labels in UI) */
export const WEEKDAY_OPTIONS = [
  { value: 0, label: 'יום ראשון' },
  { value: 1, label: 'יום שני' },
  { value: 2, label: 'יום שלישי' },
  { value: 3, label: 'יום רביעי' },
  { value: 4, label: 'יום חמישי' },
  { value: 5, label: 'יום שישי' },
  { value: 6, label: 'יום שבת' },
];

const MAX_OCCURRENCES = 52;

function parseDateLocal(dateStr) {
  return new Date(`${dateStr}T12:00:00`);
}

function formatDateLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function listWeeklyOccurrenceDates(fromDateStr, untilDateStr, weekday) {
  if (!fromDateStr || !untilDateStr) return [];

  const from = parseDateLocal(fromDateStr);
  const until = parseDateLocal(untilDateStr);
  if (until < from) {
    throw new Error('תאריך הסיום חייב להיות אחרי תאריך ההתחלה');
  }

  const cursor = new Date(from);
  while (cursor.getDay() !== weekday && cursor <= until) {
    cursor.setDate(cursor.getDate() + 1);
  }

  const dates = [];
  while (cursor <= until) {
    dates.push(formatDateLocal(cursor));
    cursor.setDate(cursor.getDate() + 7);
    if (dates.length > MAX_OCCURRENCES) {
      throw new Error(`ניתן ליצור עד ${MAX_OCCURRENCES} מופעים בסדרה אחת`);
    }
  }

  if (dates.length === 0) {
    throw new Error('לא נמצאו תאריכים ביום שנבחר בטווח שציינתם');
  }

  return dates;
}

export function weekdayLabel(weekday) {
  return WEEKDAY_OPTIONS.find((w) => w.value === weekday)?.label || '';
}
