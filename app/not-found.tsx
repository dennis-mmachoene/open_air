import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-5 px-5 py-24 text-center">
      <div className="flex h-16 w-full max-w-xs overflow-hidden rounded-control" aria-hidden="true">
        {["#4f46e5", "#0ea5e9", "#14b8a6", "#f59e0b", "#ec4899"].map((c) => (
          <div key={c} className="flex-1" style={{ backgroundColor: c }} />
        ))}
      </div>
      <h1 className="font-display text-4xl text-text">Lost the thread of colour</h1>
      <p className="text-text-soft">
        That page doesn&apos;t exist — or it moved. Let&apos;s get you back to the gallery.
      </p>
      <Link
        href="/"
        className="rounded-pill bg-text px-5 py-2.5 text-sm font-medium text-canvas transition-opacity ease-standard hover:opacity-90"
      >
        Back home
      </Link>
    </div>
  );
}
