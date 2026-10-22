import { ArrowLeft, Dumbbell } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-[1600px] flex-col items-center justify-center px-6 py-16 text-center">
      <span className="gold-surface inline-flex size-16 items-center justify-center rounded-2xl text-[#1A1503] shadow-gold">
        <Dumbbell className="size-7" strokeWidth={2} aria-hidden />
      </span>
      <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-gold">
        Error 404
      </p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink">
        That page has left the gym
      </h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-subtle">
        The route you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s
        get you back home.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex h-9.5 items-center gap-2 rounded-lg border border-line bg-card px-4 text-sm font-medium text-ink transition-colors hover:border-line-strong hover:bg-card-hover"
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
        Back to home
      </Link>
    </div>
  );
}