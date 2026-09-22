import { TREATMENT_OTHER_LABEL, TREATMENT_TYPES } from '../constants/treatmentTypes';

export default function TreatmentTypeFields({ category, otherText, onCategoryChange, onOtherChange }) {
  return (
    <>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">סוג טיפול</span>
        <select
          className="w-full rounded-lg border border-olive-200 px-3 py-2.5 focus:border-olive-600 focus:outline-none focus:ring-2 focus:ring-olive-300"
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
        >
          {TREATMENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      {category === TREATMENT_OTHER_LABEL ? (
        <label className="block">
          <span className="mb-1 block text-sm font-medium">תחום טיפול (אחר)</span>
          <input
            required
            type="text"
            placeholder="לדוגמה: דיאטנית, רפואה תעסוקתית"
            className="w-full rounded-lg border border-olive-200 px-3 py-2.5 focus:border-olive-600 focus:outline-none focus:ring-2 focus:ring-olive-300"
            value={otherText}
            onChange={(e) => onOtherChange(e.target.value)}
          />
        </label>
      ) : null}
    </>
  );
}
