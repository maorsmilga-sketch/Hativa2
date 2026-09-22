export default function Layout({ children, title, subtitle }) {
  return (
    <div className="min-h-dvh bg-olive-50 text-olive-950">
      <header className="bg-olive-800 text-white shadow-md">
        <div className="mx-auto max-w-lg px-4 py-5">
          <p className="text-sm text-olive-200">חטיבת כרמלי</p>
          <h1 className="text-xl font-bold tracking-tight">{title}</h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-olive-100">{subtitle}</p>
          ) : null}
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 py-6">{children}</main>
    </div>
  );
}
