import { useCallback, useEffect, useState } from 'react';
import Layout from '../components/Layout';
import StepIndicator from '../components/StepIndicator';
import { fetchShifts, fetchAppointments, bookAppointment } from '../utils/shifts';
import { formatHebrewDate } from '../utils/timeSlots';

function treatmentDisplay(type) {
  return type || 'טיפול';
}

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
  const [form, setForm] = useState({
    personalNumber: '',
    fullName: '',
    phone: '',
    email: '',
  });

  const loadShifts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchShifts();
      setShifts(data);
    } catch (err) {
      console.error(err);
      setError('שגיאה בטעינת המשמרות. ודאו שה-Firebase מוגדר כראוי.');
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
    setForm({ personalNumber: '', fullName: '', phone: '', email: '' });
    loadShifts();
  };

  const handleSelectShift = async (shift) => {
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
      subtitle="הרשמה למשמרות טיפול — לוחמי וחיילי הכרמלי"
    >
      <StepIndicator currentStep={step} />

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
          <h2 className="mb-3 text-lg font-semibold text-olive-800">משמרות זמינות</h2>
          {loading ? (
            <p className="text-olive-600">טוען משמרות...</p>
          ) : shifts.length === 0 ? (
            <p className="rounded-xl bg-white p-4 text-olive-600 shadow-sm">
              אין משמרות פתוחות כרגע. נסו שוב מאוחר יותר.
            </p>
          ) : (
            <ul className="space-y-3">
              {shifts.map((shift) => (
                <li key={shift.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectShift(shift)}
                    className="w-full rounded-xl border border-olive-200 bg-white p-4 text-right shadow-sm transition hover:border-olive-500 hover:shadow-md active:scale-[0.99]"
                  >
                    <p className="font-semibold text-olive-900">
                      {formatHebrewDate(shift.date)}
                    </p>
                    <p className="mt-1 text-olive-700">{shift.doctorName}</p>
                    <p className="text-sm text-olive-600">
                      {treatmentDisplay(shift.treatmentType)}
                    </p>
                    <p className="mt-2 text-xs text-olive-500">
                      {shift.startTime} – {shift.endTime}
                    </p>
                  </button>
                </li>
              ))}
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
            חזרה לרשימת משמרות
          </button>
          <h2 className="mb-1 text-lg font-semibold text-olive-800">בחירת שעה</h2>
          <p className="mb-4 text-sm text-olive-600">
            {selectedShift.doctorName} · {formatHebrewDate(selectedShift.date)}
          </p>
          {appointmentsLoading ? (
            <p className="text-olive-600">טוען משבצות...</p>
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
    </Layout>
  );
}
