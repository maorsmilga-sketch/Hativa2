const STEPS = ['בחירת טיפול', 'בחירת שעה', 'פרטי הרשמה'];

export default function StepIndicator({ currentStep, onStepClick }) {
  return (
    <nav aria-label="שלבי הרשמה" className="mb-6 flex gap-2">
      {STEPS.map((label, index) => {
        const stepNum = index + 1;
        const active = stepNum === currentStep;
        const done = stepNum < currentStep;
        const canNavigate = done && typeof onStepClick === 'function';

        const className = `flex-1 rounded-full border px-2 py-3 text-center text-xs font-bold transition sm:text-sm ${
          active
            ? 'border-olive-900 bg-olive-900 text-white shadow-sm'
            : done
              ? 'border-olive-500 bg-olive-100 text-olive-900'
              : 'border-dashed border-olive-200 bg-white text-olive-400'
        } ${canNavigate ? 'cursor-pointer hover:bg-olive-50 active:scale-[0.98]' : ''}`;

        if (canNavigate) {
          return (
            <button
              key={label}
              type="button"
              className={className}
              onClick={() => onStepClick(stepNum)}
            >
              {label}
            </button>
          );
        }

        return (
          <div
            key={label}
            className={className}
            aria-current={active ? 'step' : undefined}
            aria-disabled={!active && !done ? true : undefined}
          >
            {label}
          </div>
        );
      })}
    </nav>
  );
}
