export const TREATMENT_OTHER_LABEL = 'אחר';

export const TREATMENT_TYPES = [
  'אורתופדיה',
  'עיסוי',
  'פיזיותרפיה',
  'רפואה משלימה',
  'פסיכולוגיה',
  'רופא שיניים',
  TREATMENT_OTHER_LABEL,
];

export function resolveTreatmentType(category, otherText) {
  if (category === TREATMENT_OTHER_LABEL) {
    const custom = (otherText || '').trim();
    if (!custom) throw new Error('יש להזין תחום טיפול כשבוחרים «אחר»');
    return custom;
  }
  return category;
}

export function splitTreatmentType(storedType) {
  const value = storedType || '';
  if (TREATMENT_TYPES.includes(value)) {
    return { category: value, otherText: '' };
  }
  return { category: TREATMENT_OTHER_LABEL, otherText: value };
}

export function displayTreatmentType(storedType) {
  return storedType || 'טיפול';
}
