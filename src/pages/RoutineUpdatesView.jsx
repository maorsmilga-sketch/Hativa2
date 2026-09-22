import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { fetchRoutineUpdates } from '../utils/routineUpdates';

export default function RoutineUpdatesView() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchRoutineUpdates();
      setItems(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'שגיאה בטעינת העדכונים');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selected = items.find((item) => item.id === selectedId) || null;

  return (
    <Layout
      title="רפואת שגרה"
      subtitle="עדכונים"
      showAdminLink
    >
      <Link
        to="/"
        className="mb-4 inline-block text-sm font-medium text-olive-700 underline"
      >
        חזרה להרשמה לטיפולים
      </Link>

      {error ? (
        <p className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-olive-600">טוען עדכונים...</p>
      ) : items.length === 0 ? (
        <p className="rounded-xl bg-white p-4 text-sm text-olive-600 shadow-sm">
          אין עדכונים כרגע. בדקו שוב מאוחר יותר.
        </p>
      ) : (
        <div className="space-y-4">
          <section>
            <h2 className="mb-3 text-base font-semibold text-olive-800">נושאים</h2>
            <ul className="space-y-2">
              {items.map((item) => {
                const active = item.id === selectedId;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(active ? null : item.id)}
                      className={`w-full rounded-xl border px-4 py-3 text-right text-sm font-medium transition ${
                        active
                          ? 'border-olive-600 bg-olive-100 text-olive-900'
                          : 'border-olive-200 bg-white text-olive-800 hover:border-olive-400'
                      }`}
                    >
                      {item.title}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {selected ? (
            <section className="rounded-xl border border-olive-200 bg-white p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-olive-900">{selected.title}</h3>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-olive-800">
                {selected.description}
              </p>
            </section>
          ) : (
            <p className="text-center text-sm text-olive-500">בחרו נושא כדי לקרוא את העדכון</p>
          )}
        </div>
      )}
    </Layout>
  );
}
