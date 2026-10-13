import type { Metadata } from "next";
import { ArrowLeft, Construction } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { navGroups, navIndex } from "@/lib/nav";

type SectionPageProps = {
  params: Promise<{ section: string }>;
};

export function generateStaticParams() {
  return Object.keys(navIndex)
    .filter((section) => section !== "/")
    .map((section) => ({ section }));
}

export function generateMetadata({
  params,
}: SectionPageProps): Promise<Metadata> {
  return params.then(({ section }) => ({
    title: navIndex[section]?.label ?? "Not found",
  }));
}

export default async function SectionPage({ params }: SectionPageProps) {
  const { section } = await params;
  const entry = navIndex[section];

  if (!entry) notFound();

  const group = navGroups.find((g) => g.title === entry.group);

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="animate-fade-up">
        <h1 className="text-[26px] font-bold leading-tight tracking-tight text-ink">
          {entry.label}
        </h1>
        <p className="mt-1.5 text-sm text-subtle">
          {group?.title} workspace
        </p>
      </div>

      <div className="mt-6 flex min-h-[420px] flex-col items-center justify-center rounded-card border border-dashed border-line-strong bg-card/40 px-6 py-16 text-center">
        <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-gold/10 text-gold ring-1 ring-inset ring-gold/20">
          <Construction className="size-6" strokeWidth={1.5} aria-hidden />
        </span>
        <h2 className="mt-5 text-lg font-semibold text-ink">
          {entry.label} is on its way
        </h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-subtle">
          This section is part of the Ironclad product roadmap. The dashboard is
          fully wired up — every module will appear here next.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-9.5 items-center gap-2 rounded-lg border border-line bg-card px-4 text-sm font-medium text-ink transition-colors hover:border-line-strong hover:bg-card-hover"
        >
          <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}