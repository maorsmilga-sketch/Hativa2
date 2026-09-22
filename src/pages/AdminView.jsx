import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import RegistrantsByBattalion from '../components/RegistrantsByBattalion';
import { createShiftWithAppointments } from '../utils/shifts';

const ADMIN_PASSWORD = 'carmeli2026';
const SESSION_KEY = 'carmeli_admin_auth';

const SLOT_DURATIONS = [15, 20, 30, 45, 60];

const TREATMENT_TYPES = [
  'אורתופדיה',
  'עיסוי',
  'פיזיותרפיה',
  'רפואה משלימה',
  'פסיכולוגיה',
  'אחר',
];

const emptyForm = {
  doctorName: '',
  treatmentType: TREATMENT_TYPES[0],
  date: '',
  startTime: '08:00',
  endTime: '17:00',
  slotDuration: '30',
};

function isAuthenticated() {
  return sessionStorage.getItem(SESSION_KEY) === 'true';
}

export default function AdminView() {
  const [authed, setAuthed] = useState(isAuthenticated);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [registrantsRefresh, setRegistrantsRefresh] = useState(0);

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      setAuthed(true);
      setPasswordError('');
    } else {
      setPasswordError('סיסמה שגויה');
    }
  };

  const handleShare = async () => {
    const url = window.location.origin + '/';
    const shareData = {
      title: 'חטיבת כרמלי — הרשמה לטיפולים',
      text: 'להרשמה למשמרות טיפול ושיקום בחטיבת כרמלי:',
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        setMessage({ type: 'success', text: 'הקישור הועתק ללוח — ניתן להדביק ב-WhatsApp' });
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setMessage({ type: 'error', text: 'לא ניתן לשתף כרגע' });
      }
    }
  };

  const handleCreateShift = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });
    try {
      const shiftId = await createShiftWithAppointments(form);
      setMessage({
        type: 'success',
        text: `משמרת נוצרה בהצלחה (${shiftId.slice(0, 8)}…). המשבצות נשמרו ב-Firestore.`,
      });
      setForm(emptyForm);
      setRegistrantsRefresh((n) => n + 1);
    } catch (err) {
      console.error(err);
      setMessage({
        type: 'error',
        text: err.message || 'שגיאה ביצירת המשמרת. בדקו את הגדרות Firebase.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!authed) {
    return (
      <Layout title="כניסת מנהל" subtitle="אזור מוגבל — חטיבת כרמלי">
        <form
          onSubmit={handleLogin}
          className="mx-auto max-w-sm space-y-4 rounded-xl bg-white p-6 shadow-md"
        >
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-olive-800">סיסמה</span>
            <input
              type="password"
              autoComplete="current-password"
              className="w-full rounded-lg border border-olive-200 px-3 py-2.5 focus:border-olive-600 focus:outline-none focus:ring-2 focus:ring-olive-300"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
            />
          </label>
          {passwordError ? (
            <p className="text-sm text-red-600">{passwordError}</p>
          ) : null}
          <button
            type="submit"
            className="w-full rounded-xl bg-olive-700 py-3 font-semibold text-white hover:bg-olive-800"
          >
            כניסה
          </button>
          <Link to="/" className="block text-center text-sm text-olive-600 underline">
            חזרה לדף ההרשמה
          </Link>
        </form>
      </Layout>
    );
  }

  return (
    <Layout title="לוח בקרה — מנהל" subtitle="יצירת משמרות טיפול">
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleShare}
          className="flex-1 rounded-xl border border-olive-600 bg-white px-4 py-2.5 text-sm font-semibold text-olive-800 hover:bg-olive-50"
        >
          שיתוף קישור להרשמה
        </button>
        <Link
          to="/"
          className="rounded-xl bg-olive-100 px-4 py-2.5 text-sm font-medium text-olive-800"
        >
          דף חיילים
        </Link>
      </div>

      {message.text ? (
        <div
          role="status"
          className={`mb-4 rounded-xl border px-4 py-3 ${
            message.type === 'success'
              ? 'border-green-600 bg-green-50 text-green-900'
              : 'border-red-300 bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <form
        onSubmit={handleCreateShift}
        className="space-y-4 rounded-xl bg-white p-4 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-olive-800">משמרת טיפול חדשה</h2>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">שם רופא / מטפל</span>
          <input
            required
            type="text"
            className="w-full rounded-lg border border-olive-200 px-3 py-2.5 focus:border-olive-600 focus:outline-none focus:ring-2 focus:ring-olive-300"
            value={form.doctorName}
            onChange={(e) => setForm({ ...form, doctorName: e.target.value })}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">סוג טיפול</span>
          <select
            className="w-full rounded-lg border border-olive-200 px-3 py-2.5 focus:border-olive-600 focus:outline-none focus:ring-2 focus:ring-olive-300"
            value={form.treatmentType}
            onChange={(e) => setForm({ ...form, treatmentType: e.target.value })}
          >
            {TREATMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">תאריך</span>
          <input
            required
            type="date"
            className="w-full rounded-lg border border-olive-200 px-3 py-2.5 focus:border-olive-600 focus:outline-none focus:ring-2 focus:ring-olive-300"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">שעת התחלה</span>
            <input
              required
              type="time"
              className="w-full rounded-lg border border-olive-200 px-3 py-2.5 focus:border-olive-600 focus:outline-none focus:ring-2 focus:ring-olive-300"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">שעת סיום</span>
            <input
              required
              type="time"
              className="w-full rounded-lg border border-olive-200 px-3 py-2.5 focus:border-olive-600 focus:outline-none focus:ring-2 focus:ring-olive-300"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">משך משבצת (דקות)</span>
          <select
            className="w-full rounded-lg border border-olive-200 px-3 py-2.5 focus:border-olive-600 focus:outline-none focus:ring-2 focus:ring-olive-300"
            value={form.slotDuration}
            onChange={(e) => setForm({ ...form, slotDuration: e.target.value })}
          >
            {SLOT_DURATIONS.map((d) => (
              <option key={d} value={String(d)}>
                {d} דקות
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-olive-700 py-3 font-semibold text-white hover:bg-olive-800 disabled:opacity-60"
        >
          {submitting ? 'יוצר משמרת...' : 'יצירת משמרת ומשבצות'}
        </button>
      </form>

      <RegistrantsByBattalion refreshToken={registrantsRefresh} />
    </Layout>
  );
}
