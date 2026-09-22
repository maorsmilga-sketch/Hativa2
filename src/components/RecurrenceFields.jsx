import { WEEKDAY_OPTIONS } from '../utils/recurrence';

export default function RecurrenceFields({
  enabled,
  weekday,
  untilDate,
  onEnabledChange,
  onWeekdayChange,
  onUntilDateChange,
}) {
  return (
    <div className="space-y-3 rounded-xl border border-olive-200 bg-olive-50/80 p-4">
      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          className="h-5 w-5 rounded border-olive-400 text-olive-700 focus:ring-olive-500"
          checked={enabled}
          onChange={(e) => onEnabledChange(e.target.checked)}
        />
        <span className="text-sm font-medium text-olive-900">טיפול מחזורי (שבועי)</span>
      </label>

      {enabled ? (
        <>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-olive-800">יום בשבוע</span>
            <select
              className="w-full rounded-lg border border-olive-200 bg-white px-3 py-2.5 text-sm"
              value={weekday}
              onChange={(e) => onWeekdayChange(Number(e.target.value))}
            >
              {WEEKDAY_OPTIONS.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-olive-800">חוזר עד תאריך</span>
            <input
              required={enabled}
              type="date"
              className="w-full rounded-lg border border-olive-200 bg-white px-3 py-2.5 text-sm"
              value={untilDate}
              onChange={(e) => onUntilDateChange(e.target.value)}
            />
          </label>
          <p className="text-xs text-olive-600">
            ייווצר טיפול נפרד בכל {WEEKDAY_OPTIONS.find((d) => d.value === weekday)?.label}{' '}
            מהתאריך הראשון שנבחר ועד תאריך הסיום (כולל).
          </p>
        </>
      ) : null}
    </div>
  );
}
