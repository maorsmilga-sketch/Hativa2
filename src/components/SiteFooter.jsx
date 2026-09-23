export default function SiteFooter({ onRefresh, refreshDisabled }) {
  if (!onRefresh) return null;

  return (
    <footer className="mt-8 border-t border-olive-100 pt-5 pb-6">
      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshDisabled}
        className="w-full rounded-full border border-olive-200 bg-white px-4 py-3 text-sm font-bold text-olive-900 shadow-sm transition hover:border-olive-400 hover:bg-olive-50 disabled:opacity-50"
      >
        {refreshDisabled ? 'טוען...' : 'רענון רשימת טיפולים'}
      </button>
    </footer>
  );
}
