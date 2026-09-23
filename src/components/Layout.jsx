import { useState } from 'react';
import { Link } from 'react-router-dom';

function BrigadeLogo({ className = '' }) {
  const [src, setSrc] = useState('/logo.png');

  return (
    <img
      src={src}
      alt="חטיבה 2 – רפואה ופינוי"
      className={`aspect-square h-16 w-16 shrink-0 object-contain sm:h-20 sm:w-20 ${className}`}
      width={80}
      height={80}
      onError={() => {
        if (src !== '/logo.svg') setSrc('/logo.svg');
      }}
    />
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
        <header className="border-b border-olive-100 bg-white/95 shadow-sm backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl items-start justify-between gap-2 px-4 py-4 sm:gap-4 sm:px-6 sm:py-5">
            <div className="flex w-[4.5rem] shrink-0 flex-col items-center gap-2 sm:w-24">
              <BrigadeLogo />
              {showAdminLink ? (
                <Link
                  to="/admin"
                  className="rounded-full border border-olive-200 bg-white px-2.5 py-1 text-[10px] font-bold text-olive-800 shadow-sm hover:border-olive-500 hover:bg-olive-50 sm:px-3 sm:text-[11px]"
                >
                  מנהל
                </Link>
              ) : null}
            </div>

            <div className="min-w-0 flex-1 pt-1 text-center sm:pt-2">
              <p className="text-xs font-bold tracking-wide text-olive-500 sm:text-sm">
                חטיבה 2 · רפואה ופינוי
              </p>
              {title ? (
                <h1 className="mt-0.5 text-base font-extrabold leading-snug text-olive-900 sm:text-lg">
                  {title}
                </h1>
              ) : null}
              {subtitle ? (
                <p className="mt-0.5 text-xs font-normal text-olive-800/80 sm:text-sm">{subtitle}</p>
              ) : null}
            </div>

            <div className="flex w-[4.5rem] shrink-0 flex-col items-center sm:w-24">
              <BrigadeLogo />
            </div>
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
