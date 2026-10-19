import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchBookedRegistrants } from '../utils/shifts';
import { downloadRegistrantsExcel } from '../utils/exportRegistrants';
import { getIsraelLocalDateString } from '../utils/shiftSchedule';
import { formatHebrewDate } from '../utils/timeSlots';

function sortByTime(entries) {
  return [...entries].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
}

function RegistrantCard({ row }) {
  return (
    <article className="rounded-xl border border-olive-100 bg-olive-50/70 p-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="font-bold text-olive-900">{row.fullName || '—'}</p>
        <p className="shrink-0 text-xs font-semibold text-olive-800">
          {row.startTime}–{row.endTime}
        </p>
      </div>
      <p className="mt-1 text-olive-800">
        {row.treatmentType || '—'} · {row.doctorName || '—'}
      </p>
      {row.location ? <p className="text-olive-700">מיקום: {row.location}</p> : null}
      <p className="mt-2 text-xs leading-relaxed text-olive-700">
        {row.battalion || '—'} · מ.א. {row.personalNumber || '—'} · ת.ז. {row.idNumber || '—'}
      </p>
      <p className="text-xs text-olive-700">{row.phone || '—'}</p>
    </article>
  );
}

export default function DailyRegistrantsReport({ refreshToken = 0 }) {
  const [registrants, setRegistrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => getIsraelLocalDateString());
  const [selectedDoctor, setSelectedDoctor] = useState('');
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

  useEffect(() => {
    if (!modalOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [modalOpen]);

  const forSelectedDay = useMemo(
    () => sortByTime(registrants.filter((r) => r.shiftDate === selectedDate)),
    [registrants, selectedDate],
  );

  const doctorsForDay = useMemo(() => {
    const names = new Set();
    forSelectedDay.forEach((r) => {
      const name = (r.doctorName || '').trim();
      if (name) names.add(name);
    });
    return [...names].sort((a, b) => a.localeCompare(b, 'he'));
  }, [forSelectedDay]);

  const filteredRows = useMemo(() => {
    if (!selectedDoctor) return forSelectedDay;
    return forSelectedDay.filter((r) => r.doctorName === selectedDoctor);
  }, [forSelectedDay, selectedDoctor]);

  useEffect(() => {
    if (selectedDoctor && !doctorsForDay.includes(selectedDoctor)) {
      setSelectedDoctor('');
    }
  }, [selectedDoctor, doctorsForDay]);

  const isToday = selectedDate === getIsraelLocalDateString();

  const closeModal = () => setModalOpen(false);

  const handleShowToday = () => {
    setSelectedDate(getIsraelLocalDateString());
    setModalOpen(true);
  };

  const handleShowSelectedDay = () => {
    setModalOpen(true);
  };

  const handleExportDay = () => {
    if (filteredRows.length === 0) return;
    const doctorSuffix = selectedDoctor
      ? `-${selectedDoctor.replace(/\s+/g, '-').slice(0, 24)}`
      : '';
    downloadRegistrantsExcel(filteredRows, { fileLabel: `${selectedDate}${doctorSuffix}` });
  };

  return (
    <section id="admin-daily" className="card-surface scroll-mt-20 space-y-4 p-4 sm:p-5">
      <h2 className="text-lg font-bold text-olive-900">דוח יומי — נרשמים לפי תאריך</h2>
      <p className="text-sm text-olive-800">
        בחרו תאריך ורופא/מטפל, הציגו רשימה או ייצאו לאקסל.
      </p>

      {error ? (
        <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-olive-900">תאריך</span>
          <input
            type="date"
            className="field-input"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setSelectedDoctor('');
            }}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-olive-900">רופא / מטפל</span>
          <select
            className="field-input"
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            disabled={loading || forSelectedDay.length === 0}
          >
            <option value="">כל הרופאים ביום זה</option>
            {doctorsForDay.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="text-sm text-olive-700">
        {isToday ? 'היום' : formatHebrewDate(selectedDate)} ·{' '}
        <strong>{filteredRows.length}</strong> נרשמים
        {selectedDoctor ? <span className="text-olive-600"> · {selectedDoctor}</span> : null}
      </p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          disabled={loading}
          onClick={handleShowToday}
          className="btn-primary btn-primary-block text-sm"
        >
          הצג טיפולים להיום
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={handleShowSelectedDay}
          className="min-h-11 w-full rounded-full border border-olive-500 bg-white px-4 py-2.5 text-sm font-bold text-olive-900 hover:bg-olive-50 disabled:opacity-60"
        >
          הצג יום שנבחר
        </button>
        <button
          type="button"
          disabled={loading || filteredRows.length === 0}
          onClick={handleExportDay}
          className="min-h-11 w-full rounded-full border border-olive-500 bg-olive-100 px-4 py-2.5 text-sm font-bold text-olive-900 hover:bg-olive-50 disabled:opacity-60"
        >
          ייצוא לאקסל ({filteredRows.length})
        </button>
        <button
          type="button"
          onClick={() => setSelectedDate(getIsraelLocalDateString())}
          className="min-h-11 w-full rounded-full border border-olive-200 bg-white px-4 py-2.5 text-sm font-bold text-olive-900 hover:bg-olive-50"
        >
          קפיצה להיום
        </button>
      </div>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 bg-olive-950/50"
          role="presentation"
          onClick={closeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="daily-report-title"
            className="flex h-dvh w-full flex-col bg-white sm:mx-auto sm:mt-6 sm:mb-6 sm:h-auto sm:max-h-[88dvh] sm:max-w-3xl sm:rounded-2xl sm:shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 border-b border-olive-100 px-4 py-3 sm:px-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 id="daily-report-title" className="text-base font-bold leading-snug text-olive-900 sm:text-lg">
                    טיפולים ליום {formatHebrewDate(selectedDate)}
                  </h3>
                  <p className="mt-1 text-sm text-olive-700">
                    {filteredRows.length} נרשמים
                    {selectedDoctor ? ` · ${selectedDoctor}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="shrink-0 rounded-full border border-olive-200 px-3 py-1.5 text-sm font-bold text-olive-800"
                >
                  סגירה
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-5">
              {filteredRows.length === 0 ? (
                <p className="px-2 py-8 text-center text-sm text-olive-600">
                  אין נרשמים לתאריך זה.
                </p>
              ) : (
                <>
                  <ul className="space-y-2 sm:hidden">
                    {filteredRows.map((row) => (
                      <li key={`${row.shiftId}-${row.id}`}>
                        <RegistrantCard row={row} />
                      </li>
                    ))}
                  </ul>
                  <div className="hidden overflow-x-auto sm:block">
                    <table className="w-full border-collapse text-right text-sm">
                      <thead>
                        <tr className="sticky top-0 border-b border-olive-200 bg-olive-50 text-xs font-bold text-olive-900">
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
                        {filteredRows.map((row) => (
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
                  </div>
                </>
              )}
            </div>

            <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-olive-100 bg-white px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
              <button
                type="button"
                disabled={filteredRows.length === 0}
                onClick={handleExportDay}
                className="btn-primary btn-primary-block text-sm disabled:opacity-60"
              >
                ייצוא לאקסל
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="min-h-11 w-full rounded-full border border-olive-200 px-4 py-2 text-sm font-bold"
              >
                סגירה
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
