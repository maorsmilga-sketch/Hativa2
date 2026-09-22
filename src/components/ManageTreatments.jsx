import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  TREATMENT_TYPES,
  displayTreatmentType,
  splitTreatmentType,
} from '../constants/treatmentTypes';
import {
  fetchShifts,
  updateShiftWithAppointments,
  deleteShift,
  countBookedAppointments,
} from '../utils/shifts';
import { weekdayLabel } from '../utils/recurrence';
import { formatHebrewDate } from '../utils/timeSlots';
import BreakPeriodsField from './BreakPeriodsField';
import TreatmentNotesField from './TreatmentNotesField';
import TreatmentTypeFields from './TreatmentTypeFields';
import { formatBreaksSummary } from '../utils/breaks';
import { buildTreatmentShareBody, shareText } from '../utils/share';

const SLOT_DURATIONS = [15, 20, 30, 45, 60];

const emptyShiftForm = () => ({
  doctorName: '',
  treatmentCategory: TREATMENT_TYPES[0],
  treatmentOther: '',
  date: '',
  startTime: '08:00',
  endTime: '17:00',
  slotDuration: '30',
  notes: '',
  breaks: [],
});

function sortTreatmentGroupLabels(labels) {
  const order = new Map(TREATMENT_TYPES.map((t, index) => [t, index]));
  return [...labels].sort((a, b) => {
    const indexA = order.has(a) ? order.get(a) : TREATMENT_TYPES.length;
    const indexB = order.has(b) ? order.get(b) : TREATMENT_TYPES.length;
    if (indexA !== indexB) return indexA - indexB;
    return a.localeCompare(b, 'he');
  });
}

function groupShiftsByTreatmentDomain(shifts) {
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

function shiftToForm(shift) {
  const { category, otherText } = splitTreatmentType(shift.treatmentType);
  return {
    doctorName: shift.doctorName || '',
    treatmentCategory: category,
    treatmentOther: otherText,
    date: shift.date || '',
    startTime: shift.startTime || '08:00',
    endTime: shift.endTime || '17:00',
    slotDuration: String(shift.slotDuration ?? 30),
    notes: shift.notes || '',
    breaks: Array.isArray(shift.breaks) ? shift.breaks : [],
  };
}

export default function ManageTreatments({ refreshToken = 0, onUpdated }) {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyShiftForm);
  const [bookedCount, setBookedCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchShifts();
      setShifts(data);
    } catch (err) {
      console.error(err);
      setError('שגיאה בטעינת הטיפולים');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshToken]);

  const startEdit = async (shift) => {
    setEditingId(shift.id);
    setEditForm(shiftToForm(shift));
    try {
      const count = await countBookedAppointments(shift.id);
      setBookedCount(count);
    } catch {
      setBookedCount(0);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(emptyShiftForm());
    setBookedCount(0);
  };

  const handleShareTreatment = async (shift) => {
    const url = `${window.location.origin}/`;
    try {
      const result = await shareText({
        title: 'חטיבת כרמלי — הרשמה לטיפול',
        body: buildTreatmentShareBody(shift),
        url,
      });
      if (result === 'copied') {
        setError('');
        onUpdated?.({ shared: 'treatment-copied' });
      }
    } catch (err) {
      console.error(err);
      setError('לא ניתן לשתף את פרטי הטיפול כרגע');
    }
  };

  const handleDelete = async (shift) => {
    const ok = window.confirm(
      `למחוק את הטיפול של ${shift.doctorName} בתאריך ${shift.date}?\nפעולה זו לא ניתנת לביטול.`,
    );
    if (!ok) return;

    setDeletingId(shift.id);
    setError('');
    try {
      await deleteShift(shift.id);
      if (editingId === shift.id) cancelEdit();
      await load();
      onUpdated?.({ deleted: true });
    } catch (err) {
      console.error(err);
      setError(err.message || 'שגיאה במחיקת הטיפול');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingId) return;
    setSaving(true);
    setError('');
    try {
      const result = await updateShiftWithAppointments(editingId, editForm);
      await load();
      cancelEdit();
      onUpdated?.(result);
    } catch (err) {
      console.error(err);
      setError(err.message || 'שגיאה בעדכון הטיפול');
    } finally {
      setSaving(false);
    }
  };

  const scheduleLocked = bookedCount > 0;

  const groupedShifts = useMemo(() => groupShiftsByTreatmentDomain(shifts), [shifts]);

  return (
    <section className="mt-8 space-y-4">
      <h2 className="text-lg font-semibold text-olive-800">עריכת טיפולים קיימים</h2>

      {error ? (
        <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-olive-600">טוען טיפולים...</p>
      ) : shifts.length === 0 ? (
        <p className="rounded-xl bg-white p-4 text-sm text-olive-600 shadow-sm">
          אין טיפולים לעריכה. צרו טיפול חדש למעלה.
        </p>
      ) : (
        <div className="space-y-3">
          {groupedShifts.map(({ label, shifts: groupShifts }) => {
            const sectionHasEdit = groupShifts.some((s) => s.id === editingId);
            return (
              <details
                key={label}
                open={sectionHasEdit || groupedShifts.length === 1}
                className="group rounded-xl border border-olive-200 bg-olive-50/60 shadow-sm"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="text-sm font-semibold text-olive-900 sm:text-base">{label}</span>
                  <span className="flex items-center gap-2 text-xs text-olive-600">
                    <span className="rounded-full bg-olive-200/80 px-2 py-0.5 font-medium text-olive-800">
                      {groupShifts.length}{' '}
                      {groupShifts.length === 1 ? 'טיפול' : 'טיפולים'}
                    </span>
                    <span
                      className="text-olive-500 transition-transform group-open:rotate-180"
                      aria-hidden
                    >
                      ▾
                    </span>
                  </span>
                </summary>
                <ul className="space-y-3 border-t border-olive-200 bg-white p-3 pt-2">
                  {groupShifts.map((shift) => (
            <li
              key={shift.id}
              className="rounded-xl border border-olive-200 bg-white p-4 shadow-sm"
            >
              {editingId === shift.id ? (
                <form onSubmit={handleSave} className="space-y-3">
                  <p className="text-sm font-semibold text-olive-800">עריכת טיפול</p>
                  {scheduleLocked ? (
                    <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                      יש {bookedCount} נרשמים — ניתן לערוך שם מטפל, סוג טיפול ותאריך בלבד. שעות
                      ומשבצות נעולות.
                    </p>
                  ) : null}

                  <label className="block">
                    <span className="mb-1 block text-sm font-medium">שם רופא / מטפל</span>
                    <input
                      required
                      type="text"
                      className="w-full rounded-lg border border-olive-200 px-3 py-2.5"
                      value={editForm.doctorName}
                      onChange={(e) =>
                        setEditForm({ ...editForm, doctorName: e.target.value })
                      }
                    />
                  </label>

                  <TreatmentTypeFields
                    category={editForm.treatmentCategory}
                    otherText={editForm.treatmentOther}
                    onCategoryChange={(value) =>
                      setEditForm({ ...editForm, treatmentCategory: value })
                    }
                    onOtherChange={(value) =>
                      setEditForm({ ...editForm, treatmentOther: value })
                    }
                  />

                  <TreatmentNotesField
                    id={`edit-notes-${editingId}`}
                    value={editForm.notes}
                    onChange={(value) => setEditForm({ ...editForm, notes: value })}
                  />

                  <label className="block">
                    <span className="mb-1 block text-sm font-medium">תאריך</span>
                    <input
                      required
                      type="date"
                      className="w-full rounded-lg border border-olive-200 px-3 py-2.5"
                      value={editForm.date}
                      onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    />
                  </label>

                  <BreakPeriodsField
                    breaks={editForm.breaks}
                    disabled={scheduleLocked}
                    onChange={(breaks) => setEditForm({ ...editForm, breaks })}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="mb-1 block text-sm font-medium">שעת התחלה</span>
                      <input
                        required
                        type="time"
                        disabled={scheduleLocked}
                        className="w-full rounded-lg border border-olive-200 px-3 py-2.5 disabled:bg-olive-50"
                        value={editForm.startTime}
                        onChange={(e) =>
                          setEditForm({ ...editForm, startTime: e.target.value })
                        }
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-sm font-medium">שעת סיום</span>
                      <input
                        required
                        type="time"
                        disabled={scheduleLocked}
                        className="w-full rounded-lg border border-olive-200 px-3 py-2.5 disabled:bg-olive-50"
                        value={editForm.endTime}
                        onChange={(e) =>
                          setEditForm({ ...editForm, endTime: e.target.value })
                        }
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-1 block text-sm font-medium">משך משבצת (דקות)</span>
                    <select
                      disabled={scheduleLocked}
                      className="w-full rounded-lg border border-olive-200 px-3 py-2.5 disabled:bg-olive-50"
                      value={editForm.slotDuration}
                      onChange={(e) =>
                        setEditForm({ ...editForm, slotDuration: e.target.value })
                      }
                    >
                      {SLOT_DURATIONS.map((d) => (
                        <option key={d} value={String(d)}>
                          {d} דקות
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 rounded-xl bg-olive-700 py-2.5 text-sm font-semibold text-white hover:bg-olive-800 disabled:opacity-60"
                    >
                      {saving ? 'שומר...' : 'שמירת שינויים'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-xl border border-olive-300 px-4 py-2.5 text-sm font-medium text-olive-800"
                    >
                      ביטול
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 text-sm">
                    <p className="font-semibold text-olive-900">
                      {formatHebrewDate(shift.date)}
                      {shift.isRecurring ? (
                        <span className="mr-2 inline-block rounded-full bg-olive-200 px-2 py-0.5 text-xs font-medium text-olive-800">
                          מחזורי
                        </span>
                      ) : null}
                    </p>
                    {shift.isRecurring && shift.recurrenceWeekday != null ? (
                      <p className="text-xs text-olive-500">
                        {weekdayLabel(shift.recurrenceWeekday)}
                        {shift.recurrenceUntil
                          ? ` · עד ${formatHebrewDate(shift.recurrenceUntil)}`
                          : ''}
                      </p>
                    ) : null}
                    <p className="text-olive-700">{shift.doctorName}</p>
                    <p className="mt-1 text-xs text-olive-500">
                      {shift.startTime} – {shift.endTime} · משבצת {shift.slotDuration} דק׳
                    </p>
                    {formatBreaksSummary(shift.breaks) ? (
                      <p className="mt-1 text-xs text-olive-500">
                        הפסקות: {formatBreaksSummary(shift.breaks)}
                      </p>
                    ) : null}
                    {shift.notes ? (
                      <p className="mt-2 line-clamp-2 text-xs text-olive-600">{shift.notes}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => handleShareTreatment(shift)}
                      className="rounded-lg border border-olive-600 bg-olive-50 px-3 py-2 text-sm font-medium text-olive-900 hover:bg-olive-100"
                    >
                      שיתוף טיפול
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(shift)}
                      className="rounded-lg border border-olive-400 px-3 py-2 text-sm font-medium text-olive-800 hover:bg-olive-50"
                    >
                      עריכה
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(shift)}
                      disabled={deletingId === shift.id}
                      className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-800 hover:bg-red-50 disabled:opacity-60"
                    >
                      {deletingId === shift.id ? 'מוחק...' : 'מחיקה'}
                    </button>
                  </div>
                </div>
              )}
            </li>
                  ))}
                </ul>
              </details>
            );
          })}
        </div>
      )}
    </section>
  );
}
