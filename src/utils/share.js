import { displayTreatmentType } from '../constants/treatmentTypes';
import { formatBreaksSummary } from './breaks';
import { formatHebrewDate } from './timeSlots';

export async function shareText({ title, body, url }) {
  const fullText = url ? `${body}\n\n${url}` : body;
  try {
    if (navigator.share) {
      await navigator.share({
        title,
        text: fullText,
        ...(url ? { url } : {}),
      });
      return 'shared';
    }
    await navigator.clipboard.writeText(fullText);
    return 'copied';
  } catch (err) {
    if (err?.name === 'AbortError') return 'cancelled';
    throw err;
  }
}

export function buildTreatmentShareBody(shift) {
  const lines = [
    'חטיבת כרמלי — הרשמה לטיפול',
    '',
    `מטפל/ת: ${shift.doctorName || '—'}`,
    `סוג טיפול: ${displayTreatmentType(shift.treatmentType)}`,
    `תאריך: ${formatHebrewDate(shift.date)}`,
    `שעות: ${shift.startTime} – ${shift.endTime}`,
  ];
  const breaksText = formatBreaksSummary(shift.breaks);
  if (breaksText) {
    lines.push(`הפסקות (לא ניתן להירשם): ${breaksText}`);
  }
  if (shift.notes) {
    lines.push(`הערות: ${shift.notes}`);
  }
  lines.push('', 'להרשמה לחיילים — היכנסו לקישור:');
  return lines.join('\n');
}

export function buildRegistrantsShareBody(registrants, groups) {
  const lines = ['חטיבת כרמלי — רשימת נרשמים לטיפולים', ''];

  if (!registrants.length) {
    lines.push('אין נרשמים כרגע.');
    return lines.join('\n');
  }

  groups.forEach(({ name, entries }) => {
    lines.push(`▪ ${name} (${entries.length})`);
    entries.forEach((entry) => {
      lines.push(
        `  • ${entry.fullName || '—'} | ${entry.startTime}–${entry.endTime} | ${formatHebrewDate(entry.shiftDate)}`,
      );
      lines.push(
        `    מ.א. ${entry.personalNumber || '—'} | ת.ז. ${entry.idNumber || '—'} | ${entry.phone || '—'}`,
      );
      lines.push(
        `    ${displayTreatmentType(entry.treatmentType)} | ${entry.doctorName || '—'}`,
      );
    });
    lines.push('');
  });

  return lines.trim();
}
