const STEPS = ['בחירת טיפול', 'בחירת שעה', 'פרטי הרשמה'];

export default function StepIndicator({ currentStep }) {
  return (
    <nav aria-label="שלבי הרשמה" className="mb-6 flex gap-2">
      {STEPS.map((label, index) => {
        const stepNum = index + 1;
        const active = stepNum === currentStep;
        const done = stepNum < currentStep;
        return (
          <div
            key={label}
            className={`flex-1 rounded-lg border px-2 py-2 text-center text-xs font-medium ${
              active
                ? 'border-olive-700 bg-olive-700 text-white'
                : done
                  ? 'border-olive-400 bg-olive-100 text-olive-800'
                  : 'border-olive-200 bg-white text-olive-500'
            }`}
          >
            {label}
          </div>
        );
      })}
    </nav>
  );
}
