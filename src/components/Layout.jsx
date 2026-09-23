import { useState } from 'react';
import { Link } from 'react-router-dom';

const LOGO_CLASS =
  'aspect-square h-[4.75rem] w-[4.75rem] shrink-0 object-contain sm:h-[5.75rem] sm:w-[5.75rem]';

function BrigadeLogo() {
  const [src, setSrc] = useState('/logo.png');

  return (
    <img
      src={src}
      alt="חטיבה 2 – רפואה ופינוי"
      className={LOGO_CLASS}
      width={92}
      height={92}
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
          <div className="mx-auto grid max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-2 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
            <div className="flex h-[4.75rem] w-[4.75rem] items-center justify-center sm:h-[5.75rem] sm:w-[5.75rem]">
              <BrigadeLogo />
            </div>

            <div className="flex min-w-0 flex-col items-center justify-center text-center">
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
              {showAdminLink ? (
                <Link
                  to="/admin"
                  className="mt-2 inline-flex rounded-full border border-olive-200 bg-white px-3 py-1 text-[10px] font-bold text-olive-800 shadow-sm hover:border-olive-500 hover:bg-olive-50 sm:text-[11px]"
                >
                  מנהל
                </Link>
              ) : null}
            </div>

            <div className="flex h-[4.75rem] w-[4.75rem] items-center justify-center sm:h-[5.75rem] sm:w-[5.75rem]">
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
