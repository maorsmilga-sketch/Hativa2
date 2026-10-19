const SECTIONS = [
  { id: 'admin-daily', label: 'דוח יומי' },
  { id: 'admin-new-treatment', label: 'טיפול חדש' },
  { id: 'admin-manage-treatments', label: 'עריכת טיפולים' },
  { id: 'admin-registrants', label: 'נרשמים' },
  { id: 'admin-routine', label: 'רפואת שגרה' },
  { id: 'admin-battalion', label: 'לפי גדוד' },
];

export default function AdminNav() {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav
      aria-label="ניווט מנהל"
      className="sticky top-0 z-20 -mx-4 mb-4 border-b border-olive-100 bg-white/95 px-4 py-2 shadow-sm backdrop-blur-sm sm:-mx-6 sm:px-6"
    >
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => scrollTo(section.id)}
            className="shrink-0 rounded-full border border-olive-200 bg-olive-50 px-3 py-2 text-xs font-bold text-olive-900 hover:bg-olive-100"
          >
            {section.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
