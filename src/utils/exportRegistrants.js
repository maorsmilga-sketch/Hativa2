import * as XLSX from 'xlsx';
import { BATTALIONS, UNKNOWN_BATTALION } from '../constants/battalions';

function battalionSortIndex(battalion) {
  if (!battalion) return BATTALIONS.length + 1;
  const idx = BATTALIONS.indexOf(battalion);
  return idx === -1 ? BATTALIONS.length : idx;
}

function sortForExport(registrants) {
  return [...registrants].sort((a, b) => {
    const battalionCmp =
      battalionSortIndex(a.battalion) - battalionSortIndex(b.battalion);
    if (battalionCmp !== 0) return battalionCmp;
    const dateCmp = (a.shiftDate || '').localeCompare(b.shiftDate || '');
    if (dateCmp !== 0) return dateCmp;
    return (a.startTime || '').localeCompare(b.startTime || '');
  });
}

export function downloadRegistrantsExcel(registrants) {
  if (!registrants.length) return;

  const rows = sortForExport(registrants).map((entry) => ({
    גדוד: entry.battalion || UNKNOWN_BATTALION,
    'שם מלא': entry.fullName || '',
    'מספר אישי': entry.personalNumber || '',
    'ת.ז.': entry.idNumber || '',
    טלפון: entry.phone || '',
    'דוא"ל': entry.email || '',
    'תאריך טיפול': entry.shiftDate || '',
    'שעת התחלה': entry.startTime || '',
    'שעת סיום': entry.endTime || '',
    'סוג טיפול': entry.treatmentType || '',
    מטפל: entry.doctorName || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 14 },
    { wch: 22 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
    { wch: 24 },
    { wch: 12 },
    { wch: 10 },
    { wch: 10 },
    { wch: 16 },
    { wch: 18 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'נרשמים');

  const dateStamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `carmeli-nrshamim-${dateStamp}.xlsx`);
}
