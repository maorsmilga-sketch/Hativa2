import { useCallback, useEffect, useState } from 'react';
import {
  createRoutineUpdate,
  deleteRoutineUpdate,
  fetchRoutineUpdates,
  updateRoutineUpdate,
} from '../utils/routineUpdates';

const emptyForm = () => ({
  title: '',
  description: '',
  sortOrder: '0',
});

export default function ManageRoutineUpdates({ refreshToken = 0, onChanged }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await fetchRoutineUpdates());
    } catch (err) {
      console.error(err);
      setError(err.message || 'שגיאה בטעינת עדכוני רפואת שגרה');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshToken]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await createRoutineUpdate({
        title: form.title,
        description: form.description,
        sortOrder: form.sortOrder,
      });
      setForm(emptyForm());
      await load();
      onChanged?.({ routineUpdated: true });
    } catch (err) {
      console.error(err);
      setError(err.message || 'שגיאה בשמירה');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditForm({
      title: item.title || '',
      description: item.description || '',
      sortOrder: String(item.sortOrder ?? 0),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(emptyForm());
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingId) return;
    setSavingId(editingId);
    setError('');
    try {
      await updateRoutineUpdate(editingId, editForm);
      cancelEdit();
      await load();
      onChanged?.({ routineUpdated: true });
    } catch (err) {
      console.error(err);
      setError(err.message || 'שגיאה בעדכון');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (item) => {
    const ok = window.confirm(`למחוק את העדכון «${item.title}»?`);
    if (!ok) return;
    setDeletingId(item.id);
    setError('');
    try {
      await deleteRoutineUpdate(item.id);
      if (editingId === item.id) cancelEdit();
      await load();
      onChanged?.({ routineUpdated: true });
    } catch (err) {
      console.error(err);
      setError(err.message || 'שגיאה במחיקה');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="mt-8 space-y-4">
      <h2 className="text-lg font-semibold text-olive-800">רפואת שגרה — עדכונים לחיילים</h2>
      <p className="text-sm text-olive-600">
        התוכן מוצג בדף «רפואת שגרה — עדכונים» באפליקציית החיילים.
      </p>

      {error ? (
        <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <form
        onSubmit={handleCreate}
        className="space-y-3 rounded-xl border border-olive-200 bg-white p-4 shadow-sm"
      >
        <h3 className="text-sm font-semibold text-olive-800">הוספת נושא חדש</h3>
        <input
          required
          className="w-full rounded-lg border border-olive-200 px-3 py-2.5 text-sm"
          placeholder="תחום / כותרת (למשל: רפואת שיניים)"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <textarea
          required
          rows={4}
          className="w-full rounded-lg border border-olive-200 px-3 py-2.5 text-sm"
          placeholder="תיאור / עדכון (טקסט חופשי)"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <label className="block text-sm">
          <span className="mb-1 block text-olive-700">סדר תצוגה (מספר קטן = למעלה)</span>
          <input
            type="number"
            className="w-24 rounded-lg border border-olive-200 px-3 py-2"
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-olive-700 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {submitting ? 'שומר...' : 'פרסום עדכון'}
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-olive-600">טוען...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-olive-500">אין עדכונים עדיין.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-olive-200 bg-white p-4 shadow-sm"
            >
              {editingId === item.id ? (
                <form onSubmit={handleSaveEdit} className="space-y-3">
                  <input
                    required
                    className="w-full rounded-lg border border-olive-200 px-3 py-2 text-sm"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  />
                  <textarea
                    required
                    rows={4}
                    className="w-full rounded-lg border border-olive-200 px-3 py-2 text-sm"
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                  />
                  <input
                    type="number"
                    className="w-24 rounded-lg border border-olive-200 px-3 py-2 text-sm"
                    value={editForm.sortOrder}
                    onChange={(e) => setEditForm({ ...editForm, sortOrder: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={savingId === item.id}
                      className="flex-1 rounded-xl bg-olive-700 py-2 text-sm font-semibold text-white"
                    >
                      {savingId === item.id ? 'שומר...' : 'שמירה'}
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
                  <div className="min-w-0 text-sm">
                    <p className="font-semibold text-olive-900">{item.title}</p>
                    <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-olive-700">
                      {item.description}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="rounded-lg border border-olive-400 px-3 py-2 text-xs font-medium"
                    >
                      עריכה
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      disabled={deletingId === item.id}
                      className="rounded-lg border border-red-300 px-3 py-2 text-xs font-medium text-red-800"
                    >
                      {deletingId === item.id ? 'מוחק...' : 'מחיקה'}
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
