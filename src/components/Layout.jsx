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
}) {
  return (
    <div className="medical-page-bg min-h-dvh text-olive-900">
      <div className="medical-page-content">
        <header className="border-b border-olive-100 bg-white/95 shadow-sm backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
            <div className="flex w-16 shrink-0 flex-col items-center gap-2 sm:w-20">
              <BrigadeLogo />
              {showAdminLink ? (
                <Link
                  to="/admin"
                  className="rounded-full border border-olive-200 bg-white px-2.5 py-1 text-[10px] font-bold text-olive-800 shadow-sm hover:border-olive-500 hover:bg-olive-50 sm:text-[11px]"
                >
                  מנהל
                </Link>
              ) : null}
            </div>

            <div className="flex min-h-16 min-w-0 flex-1 flex-col items-center justify-center text-center sm:min-h-20">
              {title ? (
                <h1 className="w-full text-[clamp(0.9rem,3.5vw,1.35rem)] font-extrabold leading-tight text-olive-900">
                  {title}
                </h1>
              ) : null}
              {subtitle ? (
                <p className="mt-0.5 w-full text-[clamp(0.78rem,3vw,1.05rem)] font-semibold leading-snug text-olive-800">
                  {subtitle}
                </p>
              ) : null}
            </div>

            <div className="flex w-16 shrink-0 flex-col items-center sm:w-20">
              <BrigadeLogo />
            </div>
          </div>
          {headerNotice ? (
            <div className="border-t border-olive-100 bg-olive-50/80 px-4 py-2 sm:px-6">{headerNotice}</div>
          ) : null}
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
