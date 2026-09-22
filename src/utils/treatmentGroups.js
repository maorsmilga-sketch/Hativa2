import { TREATMENT_TYPES, displayTreatmentType } from '../constants/treatmentTypes';

export function sortTreatmentGroupLabels(labels) {
  const order = new Map(TREATMENT_TYPES.map((t, index) => [t, index]));
  return [...labels].sort((a, b) => {
    const indexA = order.has(a) ? order.get(a) : TREATMENT_TYPES.length;
    const indexB = order.has(b) ? order.get(b) : TREATMENT_TYPES.length;
    if (indexA !== indexB) return indexA - indexB;
    return a.localeCompare(b, 'he');
  });
}

export function groupShiftsByTreatmentDomain(shifts) {
  const map = new Map();
  shifts.forEach((shift) => {
    const label = displayTreatmentType(shift.treatmentType);
    if (!map.has(label)) map.set(label, []);
    map.get(label).push(shift);
  });
  return sortTreatmentGroupLabels([...map.keys()]).map((label) => ({
    label,
    shifts: map.get(label),
  }));
}
