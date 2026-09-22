import { useCallback, useEffect, useState } from 'react';
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
import { formatHebrewDate } from '../utils/timeSlots';
import TreatmentNotesField from './TreatmentNotesField';
import TreatmentTypeFields from './TreatmentTypeFields';

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
});

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
        <ul className="space-y-3">
          {shifts.map((shift) => (
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
                    </p>
                    <p className="text-olive-700">{shift.doctorName}</p>
                    <p className="text-olive-600">
                      {displayTreatmentType(shift.treatmentType)}
                    </p>
                    <p className="mt-1 text-xs text-olive-500">
                      {shift.startTime} – {shift.endTime} · משבצת {shift.slotDuration} דק׳
                    </p>
                    {shift.notes ? (
                      <p className="mt-2 line-clamp-2 text-xs text-olive-600">{shift.notes}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
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
      )}
    </section>
  );
}
