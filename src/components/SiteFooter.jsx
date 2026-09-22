import { Link } from 'react-router-dom';

export default function SiteFooter({ onRefresh, refreshDisabled }) {
  return (
    <footer className="mt-10 border-t border-olive-200 pt-6 pb-8">
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshDisabled}
            className="min-h-11 w-full rounded-xl border border-olive-400 bg-white px-4 py-2.5 text-sm font-semibold text-olive-800 transition hover:bg-olive-50 active:scale-[0.99] disabled:opacity-50 sm:w-auto"
          >
            {refreshDisabled ? 'טוען...' : 'רענון רשימת טיפולים'}
          </button>
        ) : (
          <span />
        )}
        <Link
          to="/admin"
          className="min-h-11 inline-flex w-full items-center justify-center rounded-xl bg-olive-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-olive-800 active:scale-[0.99] sm:w-auto"
        >
          כניסת מנהל — הוספת טיפולים
        </Link>
      </div>
      <p className="mt-3 text-center text-xs text-olive-500">
        מנהלים: היכנסו כאן ליצירת טיפולים חדשים וצפייה בנרשמים
      </p>
    </footer>
  );
}
