import { useCallback, useEffect, useState } from 'react';
import HeaderScheduleChangeNotice from '../components/HeaderScheduleChangeNotice';
import Layout from '../components/Layout';
import SiteFooter from '../components/SiteFooter';
import StepIndicator from '../components/StepIndicator';
import {
  fetchShiftsWithAvailability,
  fetchAppointments,
  bookAppointment,
} from '../utils/shifts';
import { formatBreaksSummary } from '../utils/breaks';
import { formatHebrewDate } from '../utils/timeSlots';

import { BATTALIONS } from '../constants/battalions';
import { displayTreatmentType } from '../constants/treatmentTypes';

const emptyRegistrationForm = () => ({
  personalNumber: '',
  idNumber: '',
  battalion: '',
  fullName: '',
  phone: '',
  email: '',
});

export default function SoldierView() {
  const [step, setStep] = useState(1);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedShift, setSelectedShift] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [form, setForm] = useState(emptyRegistrationForm);

  const loadShifts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchShiftsWithAvailability();
      setShifts(data);
    } catch (err) {
      console.error(err);
      setError('שגיאה בטעינת הטיפולים. ודאו שה-Firebase מוגדר כראוי.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShifts();
  }, [loadShifts]);

  const resetToHome = () => {
    setStep(1);
    setSelectedShift(null);
    setSelectedSlot(null);
    setAppointments([]);
    setForm(emptyRegistrationForm());
    loadShifts();
  };

  const handleSelectShift = async (shift) => {
    if (shift.isFull) return;
    setSelectedShift(shift);
    setStep(2);
    setAppointmentsLoading(true);
    setError('');
    try {
      const data = await fetchAppointments(shift.id);
      setAppointments(data);
    } catch (err) {
      console.error(err);
      setError('שגיאה בטעינת המשבצות.');
    } finally {
      setAppointmentsLoading(false);
    }
  };

  const handleSelectSlot = (slot) => {
    if (slot.status === 'booked') return;
    setSelectedSlot(slot);
    setStep(3);
  };

  const handleStepIndicatorClick = (targetStep) => {
    if (targetStep >= step) return;
    setStep(targetStep);
    if (targetStep === 1) {
      setSelectedShift(null);
      setSelectedSlot(null);
      setAppointments([]);
    }
    if (targetStep === 2) {
      setSelectedSlot(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedShift || !selectedSlot) return;

    setSubmitting(true);
    setError('');
    try {
      await bookAppointment(selectedShift.id, selectedSlot.id, form);
      setSuccessMessage('ההרשמה בוצעה בהצלחה! נתראה במועד שנקבע.');
      setTimeout(() => {
        setSuccessMessage('');
        resetToHome();
      }, 2500);
    } catch (err) {
      console.error(err);
      setError(err.message || 'שגיאה בשמירת ההרשמה. נסו שוב.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout
      title="מערכת טיפולים ושיקום"
      subtitle="הרשמה לטיפולים — לוחמי וחיילי חטיבת כרמלי"
      headerNotice={<HeaderScheduleChangeNotice />}
    >
      <StepIndicator currentStep={step} onStepClick={handleStepIndicatorClick} />

      {successMessage ? (
        <div
          role="status"
          className="mb-4 rounded-xl border border-green-600 bg-green-50 px-4 py-3 text-green-900"
        >
          {successMessage}
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-red-800"
        >
          {error}
        </div>
      ) : null}

      {step === 1 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-olive-800">טיפולים זמינים</h2>
          {loading ? (
            <p className="text-olive-600">טוען טיפולים...</p>
          ) : shifts.length === 0 ? (
            <div className="space-y-4 rounded-xl border border-olive-200 bg-white p-4 shadow-sm">
              <p className="text-olive-800">
                אין טיפולים פתוחים כרגע. מנהל המערכת צריך לפרסם טיפולים לפני שניתן להירשם.
              </p>
              <p className="text-sm text-olive-600">
                לחצו למטה על <strong className="font-semibold">«כניסת מנהל»</strong> כדי
                להוסיף טיפול חדש, או רעננו את הרשימה אחרי שהטיפולים פורסמו.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {shifts.map((shift) => {
                const full = shift.isFull;
                return (
                  <li key={shift.id}>
                    <button
                      type="button"
                      disabled={full}
                      onClick={() => handleSelectShift(shift)}
                      className={`w-full rounded-xl border p-4 text-right shadow-sm transition ${
                        full
                          ? 'cursor-not-allowed border-olive-200 bg-olive-100 opacity-90'
                          : 'border-olive-200 bg-white hover:border-olive-500 hover:shadow-md active:scale-[0.99]'
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="font-semibold text-olive-900">
                          {formatHebrewDate(shift.date)}
                        </p>
                        {full ? (
                          <span className="shrink-0 rounded-full bg-olive-600 px-2 py-0.5 text-xs font-medium text-white">
                            מלא
                          </span>
                        ) : (
                          <span className="shrink-0 text-xs font-medium text-olive-600">
                            {shift.availableSlots} משבצות פנויות
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-olive-700">{shift.doctorName}</p>
                      <p className="text-sm text-olive-600">
                        {displayTreatmentType(shift.treatmentType)}
                      </p>
                      <p className="mt-2 text-xs text-olive-500">
                        {shift.startTime} – {shift.endTime}
                      </p>
                      {shift.notes ? (
                        <p className="mt-2 line-clamp-2 text-xs text-olive-600">
                          {shift.notes}
                        </p>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {step === 2 && selectedShift && (
        <section>
          <button
            type="button"
            onClick={() => {
              setStep(1);
              setSelectedShift(null);
              setAppointments([]);
            }}
            className="mb-4 text-sm font-medium text-olive-700 underline"
          >
            חזרה לרשימת טיפולים
          </button>
          <h2 className="mb-1 text-lg font-semibold text-olive-800">בחירת שעה</h2>
          <p className="mb-4 text-sm text-olive-600">
            {selectedShift.doctorName} · {formatHebrewDate(selectedShift.date)}
          </p>
          {formatBreaksSummary(selectedShift.breaks) ? (
            <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <p className="font-medium">הפסקות מטפל (לא ניתן להירשם)</p>
              <p className="mt-1">{formatBreaksSummary(selectedShift.breaks)}</p>
            </div>
          ) : null}
          {selectedShift.notes ? (
            <div className="mb-4 rounded-xl border border-olive-200 bg-olive-50 px-4 py-3 text-sm text-olive-800">
              <p className="font-medium text-olive-900">הערות לטיפול</p>
              <p className="mt-1 whitespace-pre-wrap">{selectedShift.notes}</p>
            </div>
          ) : null}
          {appointmentsLoading ? (
            <p className="text-olive-600">טוען משבצות...</p>
          ) : appointments.length > 0 &&
            appointments.every((slot) => slot.status === 'booked') ? (
            <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-4 text-sm text-amber-950">
              <p className="font-semibold">כל המשבצות בטיפול זה תפוסות</p>
              <p className="mt-2">
                לא ניתן להירשם כרגע. נסו טיפול אחר, או פנו למנהל להוספת שעות / יום טיפול
                נוסף.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {appointments.map((slot) => {
                const booked = slot.status === 'booked';
                return (
                  <button
                    key={slot.id}
                    type="button"
                    disabled={booked}
                    onClick={() => handleSelectSlot(slot)}
                    className={`rounded-lg border px-2 py-3 text-sm font-medium transition ${
                      booked
                        ? 'cursor-not-allowed border-olive-200 bg-olive-100 text-olive-400 line-through'
                        : 'border-olive-300 bg-white text-olive-900 hover:border-olive-600 hover:bg-olive-50 active:scale-95'
                    }`}
                  >
                    {slot.startTime}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {step === 3 && selectedShift && selectedSlot && (
        <section>
          <button
            type="button"
            onClick={() => setStep(2)}
            className="mb-4 text-sm font-medium text-olive-700 underline"
          >
            חזרה לבחירת שעה
          </button>
          <h2 className="mb-1 text-lg font-semibold text-olive-800">פרטי הרשמה</h2>
          <p className="mb-4 text-sm text-olive-600">
            {formatHebrewDate(selectedShift.date)} · {selectedSlot.startTime}–
            {selectedSlot.endTime}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-4 shadow-sm">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-olive-800">
                מספר אישי <span className="text-red-600">*</span>
              </span>
              <input
                required
                type="text"
                inputMode="numeric"
                className="w-full rounded-lg border border-olive-200 px-3 py-2.5 focus:border-olive-600 focus:outline-none focus:ring-2 focus:ring-olive-300"
                value={form.personalNumber}
                onChange={(e) => setForm({ ...form, personalNumber: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-olive-800">
                מספר ת.ז. <span className="text-red-600">*</span>
              </span>
              <input
                required
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={9}
                pattern="[0-9]{5,9}"
                title="הזינו מספר תעודת זהות (ספרות בלבד)"
                className="w-full rounded-lg border border-olive-200 px-3 py-2.5 focus:border-olive-600 focus:outline-none focus:ring-2 focus:ring-olive-300"
                value={form.idNumber}
                onChange={(e) =>
                  setForm({ ...form, idNumber: e.target.value.replace(/\D/g, '') })
                }
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-olive-800">
                גדוד <span className="text-red-600">*</span>
              </span>
              <select
                required
                className="w-full rounded-lg border border-olive-200 px-3 py-2.5 focus:border-olive-600 focus:outline-none focus:ring-2 focus:ring-olive-300"
                value={form.battalion}
                onChange={(e) => setForm({ ...form, battalion: e.target.value })}
              >
                <option value="" disabled>
                  בחרו גדוד
                </option>
                {BATTALIONS.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-olive-800">
                שם מלא <span className="text-red-600">*</span>
              </span>
              <input
                required
                type="text"
                className="w-full rounded-lg border border-olive-200 px-3 py-2.5 focus:border-olive-600 focus:outline-none focus:ring-2 focus:ring-olive-300"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-olive-800">
                טלפון <span className="text-red-600">*</span>
              </span>
              <input
                required
                type="tel"
                className="w-full rounded-lg border border-olive-200 px-3 py-2.5 focus:border-olive-600 focus:outline-none focus:ring-2 focus:ring-olive-300"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-olive-800">
                דוא&quot;ל (אופציונלי)
              </span>
              <input
                type="email"
                className="w-full rounded-lg border border-olive-200 px-3 py-2.5 focus:border-olive-600 focus:outline-none focus:ring-2 focus:ring-olive-300"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-olive-700 py-3 font-semibold text-white transition hover:bg-olive-800 disabled:opacity-60"
            >
              {submitting ? 'שולח...' : 'אישור הרשמה'}
            </button>
          </form>
        </section>
      )}

      <SiteFooter onRefresh={loadShifts} refreshDisabled={loading} />
    </Layout>
  );
}
