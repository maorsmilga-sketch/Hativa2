export default function SoldierHero() {
  return (
    <section className="border-b border-olive-100 bg-olive-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="relative overflow-hidden rounded-2xl border border-olive-100 bg-white px-5 py-7 shadow-sm sm:px-8 sm:py-8">
          <svg
            className="pointer-events-none absolute left-1/2 top-4 h-16 w-[min(100%,20rem)] -translate-x-1/2 text-olive-100"
            viewBox="0 0 200 60"
            fill="none"
            aria-hidden
          >
            <path
              d="M0 30 Q25 10 50 30 T100 30 T150 30 T200 30"
              stroke="currentColor"
              strokeWidth="3"
              opacity="0.45"
            />
          </svg>
          <div className="relative text-center">
            <div
              className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-olive-100 text-olive-700"
              aria-hidden
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M10 4h4v16h-4V4zm-6 6h16v4H4v-4z" />
              </svg>
            </div>
            <h2 className="text-xl font-extrabold leading-tight text-olive-900 sm:text-2xl">
              רפואה חטיבת כרמלי
            </h2>
            <p className="mt-2 text-base font-semibold text-olive-800 sm:text-lg">
              לוח טיפולים מתעדכן
            </p>
            <p className="mx-auto mt-3 max-w-md text-sm font-normal leading-relaxed text-olive-800/90 sm:text-base">
              הרשמה לטיפולים — לוחמי וחיילי חטיבת כרמלי
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
