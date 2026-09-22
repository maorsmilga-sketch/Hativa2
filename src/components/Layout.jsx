function BrigadeLogo() {
  return (
    <img
      src="/logo.png"
      alt="סמל חטיבת כרמלי"
      className="h-12 w-12 shrink-0 object-contain drop-shadow sm:h-14 sm:w-14"
      width={56}
      height={56}
    />
  );
}

export default function Layout({ children, title, subtitle }) {
  return (
    <div className="min-h-dvh bg-olive-50 text-olive-950">
      <header className="bg-olive-800 text-white shadow-md">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-4">
          <BrigadeLogo />
          <div className="min-w-0 flex-1 text-center">
            <p className="text-sm text-olive-200">חטיבת כרמלי</p>
            <h1 className="text-lg font-bold leading-tight tracking-tight sm:text-xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-1 text-xs text-olive-100 sm:text-sm">{subtitle}</p>
            ) : null}
          </div>
          <BrigadeLogo />
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 py-6">{children}</main>
    </div>
  );
}
