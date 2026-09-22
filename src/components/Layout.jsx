import { useState } from 'react';
import { Link } from 'react-router-dom';

function BrigadeLogo() {
  const [src, setSrc] = useState('/logo.png');

  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      className="aspect-square h-[4.25rem] w-[4.25rem] shrink-0 object-contain drop-shadow sm:h-24 sm:w-24"
      width={96}
      height={96}
      onError={() => {
        if (src !== '/logo.svg') setSrc('/logo.svg');
      }}
    />
  );
}

export default function Layout({ children, title, subtitle, headerNotice, showAdminLink = false }) {
  return (
    <div className="min-h-dvh bg-olive-50 text-olive-950">
      <header className="relative bg-olive-800 text-white shadow-md">
        {showAdminLink ? (
          <Link
            to="/admin"
            className="absolute top-2 right-2 z-10 rounded-lg border border-olive-500/80 bg-olive-900/40 px-2.5 py-1 text-[11px] font-semibold text-olive-100 backdrop-blur-sm hover:bg-olive-900/70 sm:text-xs"
          >
            מנהל
          </Link>
        ) : null}
        <div className="mx-auto flex max-w-lg items-center justify-between gap-2 px-4 py-4 sm:gap-3">
          <BrigadeLogo />
          <div className="min-w-0 flex-1 text-center">
            <p className="text-sm text-olive-200">חטיבת כרמלי</p>
            <h1 className="text-lg font-bold leading-tight tracking-tight sm:text-xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-1 text-xs text-olive-100 sm:text-sm">{subtitle}</p>
            ) : null}
            {headerNotice}
          </div>
          <BrigadeLogo />
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 py-6">{children}</main>
    </div>
  );
}
