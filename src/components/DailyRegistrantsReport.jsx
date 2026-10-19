import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchBookedRegistrants } from '../utils/shifts';
import { downloadRegistrantsExcel } from '../utils/exportRegistrants';
import { getIsraelLocalDateString } from '../utils/shiftSchedule';
import { formatHebrewDate } from '../utils/timeSlots';

function sortByTime(entries) {
  return [...entries].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
}

export default function DailyRegistrantsReport({ refreshToken = 0 }) {
  const [registrants, setRegistrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => getIsraelLocalDateString());
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRegistrants(await fetchBookedRegistrants());
    } catch (err) {
      console.error(err);
      setError('שגיאה בטעינת הנרשמים');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshToken]);

  const forSelectedDay = useMemo(
    () => sortByTime(registrants.filter((r) => r.shiftDate === selectedDate)),
    [registrants, selectedDate],
  );

  const isToday = selectedDate === getIsraelLocalDateString();

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  const handleShowToday = () => {
    const today = getIsraelLocalDateString();
    setSelectedDate(today);
    setModalOpen(true);
  };

  const handleShowSelectedDay = () => {
    setModalOpen(true);
  };

  const handleExportDay = () => {
    if (forSelectedDay.length === 0) return;
    downloadRegistrantsExcel(forSelectedDay, { fileLabel: selectedDate });
  };

  return (
    <section className="card-surface mt-8 space-y-4 p-4 sm:p-5">
      <h2 className="text-lg font-bold text-olive-900">דוח יומי — נרשמים לפי תאריך</h2>
      <p className="text-sm text-olive-800">
        בחרו תאריך, הציגו טבלה מלאה או ייצאו לאקסל את כל הנרשמים לאותו יום.
      </p>

      {error ? (
        <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="block min-w-[10rem] flex-1">
          <span className="mb-1 block text-sm font-semibold text-olive-900">תאריך</span>
          <input
            type="date"
            className="field-input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </label>
        <button
          type="button"
          onClick={() => setSelectedDate(getIsraelLocalDateString())}
          className="rounded-full border border-olive-200 bg-white px-4 py-2.5 text-sm font-bold text-olive-900 hover:bg-olive-50"
        >
          קפיצה להיום
        </button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          disabled={loading}
          onClick={handleShowToday}
          className="btn-primary text-sm"
        >
          הצג טיפולים להיום
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={handleShowSelectedDay}
          className="rounded-full border border-olive-500 bg-white px-4 py-2.5 text-sm font-bold text-olive-900 hover:bg-olive-50 disabled:opacity-60"
        >
          הצג טיפולים ליום שנבחר
        </button>
        <button
          type="button"
          disabled={loading || forSelectedDay.length === 0}
          onClick={handleExportDay}
          className="rounded-full border border-olive-500 bg-olive-100 px-4 py-2.5 text-sm font-bold text-olive-900 hover:bg-olive-50 disabled:opacity-60"
        >
          ייצוא לאקסל ({forSelectedDay.length})
        </button>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="rounded-full border border-olive-200 px-4 py-2.5 text-sm font-bold text-olive-800 disabled:opacity-60"
        >
          {loading ? 'טוען...' : 'רענון נתונים'}
        </button>
      </div>

      <p className="text-sm text-olive-700">
        {isToday ? 'היום' : formatHebrewDate(selectedDate)} ·{' '}
        <strong>{forSelectedDay.length}</strong> נרשמים
      </p>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-olive-950/40 p-0 sm:items-center sm:p-4"
          role="presentation"
          onClick={closeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="daily-report-title"
            className="flex max-h-[92dvh] w-full max-w-4xl flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-olive-100 px-4 py-4 sm:px-6">
              <div>
                <h3 id="daily-report-title" className="text-lg font-bold text-olive-900">
                  טיפולים ליום {formatHebrewDate(selectedDate)}
                </h3>
                <p className="mt-1 text-sm text-olive-700">
                  {forSelectedDay.length} נרשמים · {selectedDate}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-olive-200 px-3 py-1 text-sm font-bold text-olive-800"
              >
                סגירה
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-auto px-2 py-3 sm:px-4">
              {forSelectedDay.length === 0 ? (
                <p className="px-2 py-8 text-center text-sm text-olive-600">
                  אין נרשמים לתאריך זה.
                </p>
              ) : (
                <table className="w-full min-w-[640px] border-collapse text-right text-sm">
                  <thead>
                    <tr className="border-b border-olive-200 bg-olive-50 text-xs font-bold text-olive-900">
                      <th className="px-2 py-2">שעה</th>
                      <th className="px-2 py-2">שם</th>
                      <th className="px-2 py-2">גדוד</th>
                      <th className="px-2 py-2">מ.א.</th>
                      <th className="px-2 py-2">ת.ז.</th>
                      <th className="px-2 py-2">טלפון</th>
                      <th className="px-2 py-2">טיפול</th>
                      <th className="px-2 py-2">מטפל</th>
                      <th className="px-2 py-2">מיקום</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forSelectedDay.map((row) => (
                      <tr
                        key={`${row.shiftId}-${row.id}`}
                        className="border-b border-olive-100 align-top"
                      >
                        <td className="whitespace-nowrap px-2 py-2 font-semibold text-olive-900">
                          {row.startTime}–{row.endTime}
                        </td>
                        <td className="px-2 py-2 font-medium">{row.fullName || '—'}</td>
                        <td className="px-2 py-2">{row.battalion || '—'}</td>
                        <td className="px-2 py-2">{row.personalNumber || '—'}</td>
                        <td className="px-2 py-2">{row.idNumber || '—'}</td>
                        <td className="whitespace-nowrap px-2 py-2">{row.phone || '—'}</td>
                        <td className="px-2 py-2">{row.treatmentType || '—'}</td>
                        <td className="px-2 py-2">{row.doctorName || '—'}</td>
                        <td className="px-2 py-2">{row.location || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex flex-wrap gap-2 border-t border-olive-100 px-4 py-3 sm:px-6">
              <button
                type="button"
                disabled={forSelectedDay.length === 0}
                onClick={handleExportDay}
                className="btn-primary text-sm disabled:opacity-60"
              >
                ייצוא לאקסל
              </button>
              <button type="button" onClick={closeModal} className="rounded-full border border-olive-200 px-4 py-2 text-sm font-bold">
                סגירה
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
