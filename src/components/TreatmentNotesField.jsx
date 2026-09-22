export default function TreatmentNotesField({ value, onChange, id = 'treatment-notes' }) {
  return (
    <label className="block" htmlFor={id}>
      <span className="mb-1 block text-sm font-medium">הערות לטיפול (אופציונלי)</span>
      <textarea
        id={id}
        rows={3}
        placeholder="לדוגמה: להגיע עם צילומים, חניה בכניסה הצפונית..."
        className="w-full resize-y rounded-lg border border-olive-200 px-3 py-2.5 text-sm focus:border-olive-600 focus:outline-none focus:ring-2 focus:ring-olive-300"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <span className="mt-1 block text-xs text-olive-500">
        ההערות יוצגו לחיילים בעת ההרשמה לטיפול
      </span>
    </label>
  );
}
