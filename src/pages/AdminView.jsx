import { useState } from 'react';
import { Link } from 'react-router-dom';
import AdminGuard from '../components/AdminGuard';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import ManageTreatments from '../components/ManageTreatments';
import TreatmentRegistrantsManager from '../components/TreatmentRegistrantsManager';
import RegistrantsByBattalion from '../components/RegistrantsByBattalion';
import BreakPeriodsField from '../components/BreakPeriodsField';
import TreatmentNotesField from '../components/TreatmentNotesField';
import RecurrenceFields from '../components/RecurrenceFields';
import TreatmentTypeFields from '../components/TreatmentTypeFields';
import { TREATMENT_TYPES } from '../constants/treatmentTypes';
import { createShiftsFromForm } from '../utils/shifts';

const SLOT_DURATIONS = [15, 20, 30, 45, 60];

const emptyForm = {
  doctorName: '',
  treatmentCategory: TREATMENT_TYPES[0],
  treatmentOther: '',
  date: '',
  startTime: '08:00',
  endTime: '17:00',
  slotDuration: '30',
  notes: '',
  location: '',
  breaks: [],
  recurrenceEnabled: false,
  recurrenceWeekday: 2,
  recurrenceUntil: '',
};

export default function AdminView() {
  const { user, signOutAdmin } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [registrantsRefresh, setRegistrantsRefresh] = useState(0);
  const [treatmentsRefresh, setTreatmentsRefresh] = useState(0);

  const bumpRefresh = () => {
    setRegistrantsRefresh((n) => n + 1);
    setTreatmentsRefresh((n) => n + 1);
  };

  const handleShare = async () => {
    const url = window.location.origin + '/';
    const shareData = {
      title: 'חטיבת כרמלי — הרשמה לטיפולים',
      text: 'להרשמה לטיפולים ושיקום בחטיבת כרמלי:',
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
      const result = await createShiftsFromForm(form);
      setMessage({
        type: 'success',
        text:
          result.count === 1
            ? 'הטיפול נוצר בהצלחה. המשבצות נשמרו ב-Firestore.'
            : `נוצרו ${result.count} טיפולים מחזוריים (משבצות לכל תאריך).`,
      });
      setForm({ ...emptyForm });
      bumpRefresh();
    } catch (err) {
      console.error(err);
      setMessage({
        type: 'error',
        text: err.message || 'שגיאה ביצירת הטיפול. בדקו את הגדרות Firebase.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTreatmentUpdated = (result) => {
    bumpRefresh();
    if (result?.deleted) {
      setMessage({ type: 'success', text: 'הטיפול נמחק בהצלחה.' });
      return;
    }
    if (result?.shared === 'treatment-copied') {
      setMessage({
        type: 'success',
        text: 'פרטי הטיפול הועתקו ללוח — ניתן להדביק ב-WhatsApp',
      });
      return;
    }
    if (result?.registrantsUpdated) {
      bumpRefresh();
      setMessage({ type: 'success', text: 'רשימת הנרשמים עודכנה.' });
      return;
    }
    if (result?.shared === 'registrants-copied') {
      setMessage({
        type: 'success',
        text: 'רשימת הנרשמים הועתקה ללוח — ניתן להדביק ב-WhatsApp',
      });
      return;
    }
    const futureNote =
      result?.futureUpdated > 0
        ? ` עודכנו גם ${result.futureUpdated} מופעים עתידיים בסדרה המחזורית.`
        : '';
    setMessage({
      type: 'success',
      text: result?.scheduleLocked
        ? `הטיפול עודכן (שעות ומשבצות נשארו ללא שינוי בגלל נרשמים קיימים).${futureNote}`
        : `הטיפול עודכן בהצלחה.${futureNote}`,
    });
  };

  return (
    <AdminGuard>
      <Layout title="לוח בקרה — מנהל" subtitle="יצירה ועריכת טיפולים">
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
        <button
          type="button"
          onClick={signOutAdmin}
          className="rounded-xl border border-olive-300 px-4 py-2.5 text-sm font-medium text-olive-800"
        >
          התנתקות{user?.email ? ` (${user.email})` : ''}
        </button>
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
        <h2 className="text-lg font-semibold text-olive-800">טיפול חדש</h2>

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

        <TreatmentTypeFields
          category={form.treatmentCategory}
          otherText={form.treatmentOther}
          onCategoryChange={(value) => setForm({ ...form, treatmentCategory: value })}
          onOtherChange={(value) => setForm({ ...form, treatmentOther: value })}
        />

        <TreatmentNotesField
          value={form.notes}
          onChange={(value) => setForm({ ...form, notes: value })}
        />

        <label className="block">
          <span className="mb-1 block text-sm font-medium">מיקום</span>
          <input
            type="text"
            placeholder="למשל: מרפאה 3, חדר 12"
            className="w-full rounded-lg border border-olive-200 px-3 py-2.5 focus:border-olive-600 focus:outline-none focus:ring-2 focus:ring-olive-300"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">
            {form.recurrenceEnabled ? 'מתאריך (מופע ראשון בטווח)' : 'תאריך'}
          </span>
          <input
            required
            type="date"
            className="w-full rounded-lg border border-olive-200 px-3 py-2.5 focus:border-olive-600 focus:outline-none focus:ring-2 focus:ring-olive-300"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </label>

        <RecurrenceFields
          enabled={form.recurrenceEnabled}
          weekday={form.recurrenceWeekday}
          untilDate={form.recurrenceUntil}
          onEnabledChange={(recurrenceEnabled) => setForm({ ...form, recurrenceEnabled })}
          onWeekdayChange={(recurrenceWeekday) => setForm({ ...form, recurrenceWeekday })}
          onUntilDateChange={(recurrenceUntil) => setForm({ ...form, recurrenceUntil })}
        />

        <BreakPeriodsField
          breaks={form.breaks}
          onChange={(breaks) => setForm({ ...form, breaks })}
        />

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
          {submitting
            ? 'יוצר טיפול...'
            : form.recurrenceEnabled
              ? 'יצירת סדרת טיפולים ומשבצות'
              : 'יצירת טיפול ומשבצות'}
        </button>
      </form>

      <ManageTreatments refreshToken={treatmentsRefresh} onUpdated={handleTreatmentUpdated} />

      <TreatmentRegistrantsManager
        refreshToken={registrantsRefresh}
        onChanged={handleTreatmentUpdated}
      />

      <RegistrantsByBattalion
        refreshToken={registrantsRefresh}
        onShareResult={handleTreatmentUpdated}
      />
      </Layout>
    </AdminGuard>
  );
}
