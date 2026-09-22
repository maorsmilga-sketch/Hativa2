export default function BreakPeriodsField({ breaks, onChange, disabled = false }) {
  const updateBreak = (index, field, value) => {
    const next = breaks.map((b, i) => (i === index ? { ...b, [field]: value } : b));
    onChange(next);
  };

  const addBreak = () => {
    onChange([...breaks, { startTime: '12:00', endTime: '13:00' }]);
  };

  const removeBreak = (index) => {
    onChange(breaks.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-olive-800">הפסקות למטפל (ללא הרשמה)</span>
        <button
          type="button"
          disabled={disabled}
          onClick={addBreak}
          className="rounded-lg border border-olive-300 px-2 py-1 text-xs font-medium text-olive-800 hover:bg-olive-50 disabled:opacity-50"
        >
          + הוסף הפסקה
        </button>
      </div>
      {breaks.length === 0 ? (
        <p className="text-xs text-olive-500">אין הפסקות — ניתן להוסיף חלון זמן שחסום להרשמה.</p>
      ) : null}
      {breaks.map((br, index) => (
        <div key={index} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
          <label className="block">
            <span className="mb-1 block text-xs text-olive-600">התחלת הפסקה</span>
            <input
              type="time"
              disabled={disabled}
              className="w-full rounded-lg border border-olive-200 px-2 py-2 text-sm disabled:bg-olive-50"
              value={br.startTime}
              onChange={(e) => updateBreak(index, 'startTime', e.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-olive-600">סיום הפסקה</span>
            <input
              type="time"
              disabled={disabled}
              className="w-full rounded-lg border border-olive-200 px-2 py-2 text-sm disabled:bg-olive-50"
              value={br.endTime}
              onChange={(e) => updateBreak(index, 'endTime', e.target.value)}
            />
          </label>
          <button
            type="button"
            disabled={disabled}
            onClick={() => removeBreak(index)}
            className="mb-0.5 rounded-lg border border-red-200 px-2 py-2 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
            aria-label="הסר הפסקה"
          >
            הסר
          </button>
        </div>
      ))}
    </div>
  );
}
