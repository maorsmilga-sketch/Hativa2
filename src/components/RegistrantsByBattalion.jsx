import { useCallback, useEffect, useMemo, useState } from 'react';
import { BATTALIONS, UNKNOWN_BATTALION } from '../constants/battalions';
import { fetchBookedRegistrants } from '../utils/shifts';
import { formatHebrewDate } from '../utils/timeSlots';

function battalionKey(battalion) {
  if (!battalion) return UNKNOWN_BATTALION;
  return BATTALIONS.includes(battalion) ? battalion : battalion;
}

function groupRegistrants(registrants) {
  const map = new Map();
  BATTALIONS.forEach((name) => map.set(name, []));
  map.set(UNKNOWN_BATTALION, []);

  registrants.forEach((entry) => {
    const key = battalionKey(entry.battalion);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(entry);
  });

  const orderedKeys = [
    ...BATTALIONS.filter((name) => map.get(name).length > 0),
    ...[...map.keys()].filter(
      (key) => !BATTALIONS.includes(key) && key !== UNKNOWN_BATTALION && map.get(key).length > 0,
    ),
  ];
  if (map.get(UNKNOWN_BATTALION).length > 0) {
    orderedKeys.push(UNKNOWN_BATTALION);
  }

  return orderedKeys.map((name) => ({ name, entries: map.get(name) }));
}

export default function RegistrantsByBattalion({ refreshToken = 0 }) {
  const [registrants, setRegistrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchBookedRegistrants();
      setRegistrants(data);
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

  const groups = useMemo(() => groupRegistrants(registrants), [registrants]);

  return (
    <section className="mt-8 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-olive-800">נרשמים לפי גדוד</h2>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="rounded-lg border border-olive-300 bg-white px-3 py-1.5 text-sm font-medium text-olive-800 hover:bg-olive-50 disabled:opacity-60"
        >
          {loading ? 'טוען...' : 'רענון'}
        </button>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {!loading && registrants.length === 0 ? (
        <p className="rounded-xl bg-white p-4 text-sm text-olive-600 shadow-sm">
          אין נרשמים עדיין.
        </p>
      ) : null}

      {groups.map(({ name, entries }) => (
        <div key={name} className="overflow-hidden rounded-xl border border-olive-200 bg-white shadow-sm">
          <div className="flex items-center justify-between bg-olive-100 px-4 py-3">
            <h3 className="font-semibold text-olive-900">{name}</h3>
            <span className="rounded-full bg-olive-700 px-2.5 py-0.5 text-xs font-medium text-white">
              {entries.length}
            </span>
          </div>
          <ul className="divide-y divide-olive-100">
            {entries.map((entry) => (
              <li key={`${entry.shiftId}-${entry.id}`} className="space-y-1 px-4 py-3 text-sm">
                <p className="font-medium text-olive-900">{entry.fullName || '—'}</p>
                <p className="text-olive-700">
                  {formatHebrewDate(entry.shiftDate)} · {entry.startTime}–{entry.endTime}
                </p>
                <p className="text-olive-600">
                  {entry.treatmentType} · {entry.doctorName}
                </p>
                <p className="text-xs text-olive-500">
                  מ.א. {entry.personalNumber || '—'} · ת.ז. {entry.idNumber || '—'} ·{' '}
                  {entry.phone || '—'}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
