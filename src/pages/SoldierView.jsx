import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import HeaderScheduleChangeNotice from '../components/HeaderScheduleChangeNotice';
import Layout from '../components/Layout';
import SoldierHero from '../components/SoldierHero';
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
import { groupShiftsByTreatmentDomain } from '../utils/treatmentGroups';

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

  const groupedShifts = useMemo(() => groupShiftsByTreatmentDomain(shifts), [shifts]);

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
      headerNotice={<HeaderScheduleChangeNotice />}
      showAdminLink
      hero={<SoldierHero />}
    >
      <StepIndicator currentStep={step} onStepClick={handleStepIndicatorClick} />

      {step === 1 ? (
        <Link
          to="/routine"
          className="card-muted mb-5 flex w-full items-center justify-center px-4 py-3.5 text-sm font-bold text-olive-900 transition hover:border-olive-300 hover:bg-olive-100 active:scale-[0.99]"
        >
          רפואת שגרה — עדכונים
        </Link>
      ) : null}

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
          <h2 className="mb-4 text-lg font-bold text-olive-900 sm:text-xl">טיפולים זמינים</h2>
          {loading ? (
            <p className="text-olive-600">טוען טיפולים...</p>
          ) : shifts.length === 0 ? (
            <div className="card-surface space-y-4 p-5">
              <p className="text-olive-800">
                אין טיפולים פתוחים כרגע. מנהל המערכת צריך לפרסם טיפולים לפני שניתן להירשם.
              </p>
              <p className="text-sm text-olive-600">
                רעננו את הרשימה אחרי שהטיפולים פורסמו, או פנו למנהל המערכת.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {groupedShifts.map(({ label, shifts: groupShifts }) => {
                const openSlots = groupShifts.filter((s) => !s.isFull).length;
                return (
                  <details
                    key={label}
                    className="group card-muted overflow-hidden shadow-sm"
                  >
                    <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 marker:content-none [&::-webkit-details-marker]:hidden">
                      <span className="text-sm font-bold text-olive-900 sm:text-base">{label}</span>
                      <span className="flex items-center gap-2 text-xs text-olive-800">
                        <span className="rounded-full bg-olive-100 px-2.5 py-0.5 font-semibold text-olive-900">
                          {groupShifts.length} {groupShifts.length === 1 ? 'טיפול' : 'טיפולים'}
                          {openSlots > 0 ? ` · ${openSlots} פנוי` : ''}
                        </span>
                        <span
                          className="text-olive-500 transition-transform group-open:rotate-180"
                          aria-hidden
                        >
                          ▾
                        </span>
                      </span>
                    </summary>
                    <ul className="space-y-3 border-t border-olive-100 bg-white p-3 pt-3 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0 lg:grid-cols-2">
                      {groupShifts.map((shift) => {
                        const full = shift.isFull;
                        return (
                          <li key={shift.id} className="sm:list-none">
                            <button
                              type="button"
                              disabled={full}
                              onClick={() => handleSelectShift(shift)}
                              className={`card-surface flex w-full flex-col p-4 text-right transition ${
                                full
                                  ? 'cursor-not-allowed opacity-75 grayscale-[0.2]'
                                  : 'hover:border-olive-300 hover:shadow-md active:scale-[0.99]'
                              }`}
                            >
                              <div className="mb-2 flex items-start justify-between gap-2">
                                <p className="font-bold text-olive-900">{formatHebrewDate(shift.date)}</p>
                                {full ? (
                                  <span className="shrink-0 rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-bold text-gray-600">
                                    מלא · אין מקומות
                                  </span>
                                ) : (
                                  <span className="shrink-0 rounded-full bg-olive-100 px-2.5 py-0.5 text-xs font-semibold text-olive-900">
                                    {shift.availableSlots} משבצות פנויות
                                  </span>
                                )}
                              </div>
                              <p className="font-semibold text-olive-800">{shift.doctorName}</p>
                              <div className="mt-2 rounded-lg bg-olive-50 px-3 py-2 text-xs font-semibold text-olive-900">
                                שעות: {shift.startTime} – {shift.endTime}
                              </div>
                              {shift.location ? (
                                <p className="mt-2 text-xs text-olive-800">מיקום: {shift.location}</p>
                              ) : null}
                              {shift.notes ? (
                                <p className="mt-2 line-clamp-2 text-xs text-olive-800/80">
                                  {shift.notes}
                                </p>
                              ) : null}
                              {!full ? (
                                <span className="btn-primary btn-primary-block mt-4 text-sm">
                                  בחירת משבצת
                                </span>
                              ) : null}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </details>
                );
              })}
            </div>
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
            className="mb-4 text-sm font-bold text-olive-700 underline decoration-olive-300"
          >
            חזרה לרשימת טיפולים
          </button>
          <h2 className="mb-1 text-lg font-bold text-olive-900 sm:text-xl">בחירת שעה</h2>
          <p className="mb-1 text-sm text-olive-600">
            {selectedShift.doctorName} · {formatHebrewDate(selectedShift.date)}
          </p>
          {selectedShift.location ? (
            <p className="mb-4 text-sm text-olive-700">מיקום: {selectedShift.location}</p>
          ) : (
            <div className="mb-4" />
          )}
          {formatBreaksSummary(selectedShift.breaks) ? (
            <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <p className="font-medium">הפסקות מטפל (לא ניתן להירשם)</p>
              <p className="mt-1">{formatBreaksSummary(selectedShift.breaks)}</p>
            </div>
          ) : null}
          {selectedShift.notes ? (
            <div className="card-muted mb-4 px-4 py-3 text-sm text-olive-800">
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
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
              {appointments.map((slot) => {
                const booked = slot.status === 'booked';
                const selected = selectedSlot?.id === slot.id;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    disabled={booked}
                    onClick={() => handleSelectSlot(slot)}
                    aria-label={
                      booked
                        ? `${slot.startTime} — תפוס`
                        : `${slot.startTime} — פנוי`
                    }
                    className={`slot-pill ${
                      booked ? 'slot-pill-unavailable' : selected ? 'slot-pill-selected' : ''
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
          <h2 className="mb-1 text-lg font-bold text-olive-900 sm:text-xl">פרטי הרשמה</h2>
          <p className="mb-4 text-sm text-olive-600">
            {formatHebrewDate(selectedShift.date)} · {selectedSlot.startTime}–
            {selectedSlot.endTime}
          </p>

          <form onSubmit={handleSubmit} className="card-surface space-y-4 p-5">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-olive-800">
                מספר אישי <span className="text-red-600">*</span>
              </span>
              <input
                required
                type="text"
                inputMode="numeric"
                className="field-input"
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
                className="field-input"
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
                className="field-input"
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
                className="field-input"
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
                className="field-input"
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
                className="field-input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary btn-primary-block"
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
