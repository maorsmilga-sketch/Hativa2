import { useState } from 'react';
import { Link } from 'react-router-dom';

function BrigadeLogo({ className = '' }) {
  const [src, setSrc] = useState('/logo.png');

  return (
    <img
      src={src}
      alt="חטיבה 2 – רפואה ופינוי"
      className={`aspect-square h-14 w-14 shrink-0 object-contain sm:h-16 sm:w-16 ${className}`}
      width={64}
      height={64}
      onError={() => {
        if (src !== '/logo.svg') setSrc('/logo.svg');
      }}
    />
  );
}

function MedicalCrossIcon({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="10" y="4" width="4" height="16" rx="1" fill="currentColor" />
      <rect x="4" y="10" width="16" height="4" rx="1" fill="currentColor" />
    </svg>
  );
}

export default function Layout({
  children,
  title,
  subtitle,
  headerNotice,
  showAdminLink = false,
  hero,
}) {
  return (
    <div className="medical-page-bg min-h-dvh text-olive-900">
      <div className="medical-page-content">
        <header className="relative border-b border-olive-100 bg-white/95 shadow-sm backdrop-blur-sm">
          {showAdminLink ? (
            <Link
              to="/admin"
              className="absolute top-3 right-3 z-10 rounded-full border border-olive-200 bg-white px-3 py-1.5 text-[11px] font-bold text-olive-800 shadow-sm hover:border-olive-500 hover:bg-olive-50 sm:text-xs"
            >
              מנהל
            </Link>
          ) : null}
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4 sm:px-6 sm:py-5">
            <BrigadeLogo />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold tracking-wide text-olive-500 sm:text-sm">
                חטיבה 2 · רפואה ופינוי
              </p>
              {title ? (
                <h1 className="text-base font-extrabold leading-snug text-olive-900 sm:text-lg">
                  {title}
                </h1>
              ) : null}
              {subtitle ? (
                <p className="mt-0.5 text-xs font-normal text-olive-800/80 sm:text-sm">{subtitle}</p>
              ) : null}
            </div>
            <MedicalCrossIcon className="hidden h-8 w-8 text-olive-200 sm:block" />
          </div>
          {headerNotice ? (
            <div className="border-t border-olive-100 bg-olive-50/80 px-4 py-2 sm:px-6">{headerNotice}</div>
          ) : null}
        </header>

        {hero}

        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
