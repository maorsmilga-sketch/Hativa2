import { useCallback, useEffect, useMemo, useState } from 'react';
import { BATTALIONS } from '../constants/battalions';
import { displayTreatmentType } from '../constants/treatmentTypes';
import {
  cancelBookedAppointment,
  fetchShiftScheduleWithPrivate,
  fetchShifts,
  updateBookedAppointment,
} from '../utils/shifts';
import { groupShiftsByTreatmentDomain } from '../utils/treatmentGroups';
import { formatHebrewDate } from '../utils/timeSlots';

const emptySoldierForm = () => ({
  personalNumber: '',
  idNumber: '',
  battalion: '',
  fullName: '',
  phone: '',
  email: '',
});

function appointmentToForm(apt) {
  return {
    personalNumber: apt.personalNumber || '',
    idNumber: apt.idNumber || '',
    battalion: apt.battalion || '',
    fullName: apt.fullName || '',
    phone: apt.phone || '',
    email: apt.email || '',
  };
}

export default function TreatmentRegistrantsManager({ refreshToken = 0, onChanged }) {
  const [shifts, setShifts] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [booked, setBooked] = useState([]);
  const [loadingShifts, setLoadingShifts] = useState(true);
  const [loadingBooked, setLoadingBooked] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptySoldierForm);
  const [savingId, setSavingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  const loadShifts = useCallback(async () => {
    setLoadingShifts(true);
    setError('');
    try {
      const data = await fetchShifts();
      setShifts(data);
    } catch (err) {
      console.error(err);
      setError('שגיאה בטעינת הטיפולים');
    } finally {
      setLoadingShifts(false);
    }
  }, []);

  useEffect(() => {
    loadShifts();
  }, [loadShifts, refreshToken]);

  const groupedShifts = useMemo(() => groupShiftsByTreatmentDomain(shifts), [shifts]);

  const shiftsInSelectedDomain = useMemo(() => {
    if (!selectedDomain) return [];
    return groupedShifts.find((g) => g.label === selectedDomain)?.shifts ?? [];
  }, [groupedShifts, selectedDomain]);

  const selectedShift = useMemo(
    () => shifts.find((s) => s.id === selectedShiftId) || null,
    [shifts, selectedShiftId],
  );

  const loadBooked = useCallback(async (shiftId) => {
    if (!shiftId) {
      setBooked([]);
      return;
    }
    setLoadingBooked(true);
    setError('');
    setEditingId(null);
    try {
      const schedule = await fetchShiftScheduleWithPrivate(shiftId);
      setBooked(schedule.filter((a) => a.status === 'booked'));
    } catch (err) {
      console.error(err);
      setError('שגיאה בטעינת הנרשמים לטיפול');
    } finally {
      setLoadingBooked(false);
    }
  }, []);

  useEffect(() => {
    loadBooked(selectedShiftId);
  }, [selectedShiftId, loadBooked, refreshToken]);

  const handleSelectDomain = (e) => {
    setSelectedDomain(e.target.value);
    setSelectedShiftId('');
  };

  const handleSelectShift = (e) => {
    setSelectedShiftId(e.target.value);
  };

  const startEdit = (apt) => {
    setEditingId(apt.id);
    setEditForm(appointmentToForm(apt));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(emptySoldierForm());
  };

  const handleSaveEdit = async (apt) => {
    if (!selectedShiftId) return;
    setSavingId(apt.id);
    setError('');
    try {
      await updateBookedAppointment(selectedShiftId, apt.id, editForm);
      await loadBooked(selectedShiftId);
      cancelEdit();
      onChanged?.({ registrantsUpdated: true });
    } catch (err) {
      console.error(err);
      setError(err.message || 'שגיאה בעדכון הנרשם');
    } finally {
      setSavingId(null);
    }
  };

  const handleRemove = async (apt) => {
    if (!selectedShiftId) return;
    const ok = window.confirm(
      `להסיר את ${apt.fullName || 'החייל'} מהמשבצת ${apt.startTime}?\nהמשבצת תחזור להיות פנויה להרשמה.`,
    );
    if (!ok) return;

    setRemovingId(apt.id);
    setError('');
    try {
      await cancelBookedAppointment(selectedShiftId, apt.id);
      await loadBooked(selectedShiftId);
      if (editingId === apt.id) cancelEdit();
      onChanged?.({ registrantsUpdated: true });
    } catch (err) {
      console.error(err);
      setError(err.message || 'שגיאה בהסרת הנרשם');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <section className="mt-8 space-y-4">
      <h2 className="text-lg font-semibold text-olive-800">ניהול נרשמים לפי טיפול</h2>
      <p className="text-sm text-olive-600">
        בחרו תחום ואז טיפול ספציפי, צפו בנרשמים וערכו או הסירו רישום.
      </p>

      {error ? (
        <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-olive-800">תחום טיפול</span>
        <select
          className="w-full rounded-lg border border-olive-200 bg-white px-3 py-2.5 text-sm focus:border-olive-600 focus:outline-none focus:ring-2 focus:ring-olive-300"
          value={selectedDomain}
          onChange={handleSelectDomain}
          disabled={loadingShifts}
        >
          <option value="">— בחרו תחום —</option>
          {groupedShifts.map(({ label, shifts: groupShifts }) => (
            <option key={label} value={label}>
              {label} ({groupShifts.length})
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-olive-800">טיפול</span>
        <select
          className="w-full rounded-lg border border-olive-200 bg-white px-3 py-2.5 text-sm focus:border-olive-600 focus:outline-none focus:ring-2 focus:ring-olive-300 disabled:bg-olive-50"
          value={selectedShiftId}
          onChange={handleSelectShift}
          disabled={loadingShifts || !selectedDomain}
        >
          <option value="">
            {selectedDomain ? '— בחרו טיפול —' : '— קודם בחרו תחום —'}
          </option>
          {shiftsInSelectedDomain.map((shift) => (
            <option key={shift.id} value={shift.id}>
              {formatHebrewDate(shift.date)} · {shift.startTime} · {shift.doctorName}
            </option>
          ))}
        </select>
      </label>

      {selectedShift && (
        <div className="rounded-xl border border-olive-200 bg-olive-50 px-4 py-3 text-sm text-olive-800">
          <p className="font-medium">{displayTreatmentType(selectedShift.treatmentType)}</p>
          <p>
            {selectedShift.doctorName} · {formatHebrewDate(selectedShift.date)} ·{' '}
            {selectedShift.startTime}–{selectedShift.endTime}
          </p>
          {selectedShift.location ? (
            <p className="text-olive-700">מיקום: {selectedShift.location}</p>
          ) : null}
        </div>
      )}

      {!selectedShiftId ? (
        <p className="text-sm text-olive-500">בחרו טיפול כדי לראות נרשמים.</p>
      ) : loadingBooked ? (
        <p className="text-sm text-olive-600">טוען נרשמים...</p>
      ) : booked.length === 0 ? (
        <p className="rounded-xl bg-white p-4 text-sm text-olive-600 shadow-sm">
          אין נרשמים לטיפול זה.
        </p>
      ) : (
        <ul className="space-y-3">
          {booked.map((apt) => (
            <li
              key={apt.id}
              className="rounded-xl border border-olive-200 bg-white p-4 shadow-sm"
            >
              {editingId === apt.id ? (
                <form
                  className="space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSaveEdit(apt);
                  }}
                >
                  <p className="text-sm font-semibold text-olive-900">
                    עריכה — {apt.startTime}–{apt.endTime}
                  </p>
                  <input
                    required
                    className="w-full rounded-lg border border-olive-200 px-3 py-2 text-sm"
                    placeholder="מספר אישי"
                    value={editForm.personalNumber}
                    onChange={(e) =>
                      setEditForm({ ...editForm, personalNumber: e.target.value })
                    }
                  />
                  <input
                    required
                    className="w-full rounded-lg border border-olive-200 px-3 py-2 text-sm"
                    placeholder="ת.ז."
                    value={editForm.idNumber}
                    onChange={(e) =>
                      setEditForm({ ...editForm, idNumber: e.target.value.replace(/\D/g, '') })
                    }
                  />
                  <select
                    required
                    className="w-full rounded-lg border border-olive-200 px-3 py-2 text-sm"
                    value={editForm.battalion}
                    onChange={(e) => setEditForm({ ...editForm, battalion: e.target.value })}
                  >
                    <option value="" disabled>
                      גדוד
                    </option>
                    {BATTALIONS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                  <input
                    required
                    className="w-full rounded-lg border border-olive-200 px-3 py-2 text-sm"
                    placeholder="שם מלא"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  />
                  <input
                    required
                    type="tel"
                    className="w-full rounded-lg border border-olive-200 px-3 py-2 text-sm"
                    placeholder="טלפון"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                  <input
                    type="email"
                    className="w-full rounded-lg border border-olive-200 px-3 py-2 text-sm"
                    placeholder='דוא"ל (אופציונלי)'
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={savingId === apt.id}
                      className="flex-1 btn-primary text-sm disabled:opacity-60"
                    >
                      {savingId === apt.id ? 'שומר...' : 'שמירה'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-xl border border-olive-300 px-4 py-2 text-sm"
                    >
                      ביטול
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="text-sm">
                    <p className="font-semibold text-olive-900">
                      {apt.fullName || '—'} · {apt.startTime}–{apt.endTime}
                    </p>
                    <p className="mt-1 text-olive-700">
                      {apt.battalion || '—'} · מ.א. {apt.personalNumber || '—'} · ת.ז.{' '}
                      {apt.idNumber || '—'}
                    </p>
                    <p className="text-olive-600">{apt.phone || '—'}</p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(apt)}
                      className="rounded-lg border border-olive-400 px-3 py-2 text-xs font-medium text-olive-800 hover:bg-olive-50"
                    >
                      עריכה
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(apt)}
                      disabled={removingId === apt.id}
                      className="rounded-lg border border-red-300 px-3 py-2 text-xs font-medium text-red-800 hover:bg-red-50 disabled:opacity-60"
                    >
                      {removingId === apt.id ? 'מסיר...' : 'הסרה'}
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
