export default function SiteFooter({ onRefresh, refreshDisabled }) {
  if (!onRefresh) return null;

  return (
    <footer className="mt-8 border-t border-olive-200 pt-5 pb-6">
      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshDisabled}
        className="min-h-11 w-full rounded-xl border border-olive-400 bg-white px-4 py-2.5 text-sm font-semibold text-olive-800 transition hover:bg-olive-50 active:scale-[0.99] disabled:opacity-50"
      >
        {refreshDisabled ? 'טוען...' : 'רענון רשימת טיפולים'}
      </button>
    </footer>
  );
}
