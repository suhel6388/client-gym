import {
  Bell,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  MessageSquare,
  Search,
  Settings,
  UserCheck,
  Users,
  Wallet,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import { existsSync } from "node:fs";
import Image from "next/image";
import path from "node:path";

/**
 * Athlete photo: /public/images/hero-athlete.png
 * (dark background or transparent PNG, subject facing left, ~1200px wide)
 *
 * The existence check keeps the hero clean if the asset is temporarily missing.
 */
const ATHLETE_SRC = "/images/hero-athlete.png";
const ATHLETE_AVAILABLE = existsSync(
  path.join(process.cwd(), "public", "images", "hero-athlete.png"),
);

const NAV: { label: string; icon: LucideIcon; active?: boolean }[] = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Members", icon: Users },
  { label: "Attendance", icon: UserCheck },
  { label: "Trainers", icon: Dumbbell },
  { label: "Workouts", icon: ClipboardList },
  { label: "Payments", icon: Wallet },
  { label: "Plans", icon: CreditCard },
  { label: "Reports", icon: BarChart3 },
  { label: "Messages", icon: MessageSquare },
  { label: "Settings", icon: Settings },
];

const STATS = [
  { label: "Total Members", value: "2,450", delta: "+12% this month" },
  { label: "Attendance Today", value: "1,320", delta: "+8% this month" },
  { label: "Monthly Revenue", value: "₹8,45,000", delta: "+18% this month" },
  { label: "Active Trainers", value: "28", delta: "+4 this month" },
];

const MEMBERSHIP = [
  { label: "Active", count: "1,650", pct: 67, color: "#F5B323" },
  { label: "Expired", count: "450", pct: 18, color: "#8A6A1E" },
  { label: "Pending", count: "200", pct: 8, color: "#5B5B63" },
  { label: "Cancelled", count: "150", pct: 7, color: "#33333A" },
];

const MEMBERS = [
  { name: "Rahul Sharma", plan: "Premium Plan", date: "May 31, 2024" },
  { name: "Priya Patel", plan: "Standard Plan", date: "May 30, 2024" },
  { name: "Amit Verma", plan: "Premium Plan", date: "May 25, 2024" },
];

const TRANSACTIONS = [
  { name: "Membership Renewal", sub: "Rahul Sharma", amount: "+₹12,000", date: "May 31, 2024" },
  { name: "Personal Training", sub: "Priya Patel", amount: "+₹5,000", date: "May 31, 2024" },
  { name: "Supplement Sale", sub: "Receptionist", amount: "+₹2,500", date: "May 31, 2024" },
];

const CHART_POINTS = [
  [0, 78], [20, 70], [40, 74], [62, 52], [82, 62], [104, 40], [126, 56],
  [150, 30], [172, 46], [196, 24], [220, 42], [244, 20], [268, 34], [300, 12],
];

function chartPaths() {
  const line = CHART_POINTS.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  return { line, area: `${line} L300,100 L0,100 Z` };
}

function Donut() {
  const r = 40;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg viewBox="0 0 100 100" className="size-[92px] shrink-0 -rotate-90" aria-hidden>
      {MEMBERSHIP.map((m) => {
        const len = (m.pct / 100) * c;
        const el = (
          <circle
            key={m.label}
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={m.color}
            strokeWidth="13"
            strokeDasharray={`${len - 1.5} ${c - len + 1.5}`}
            strokeDashoffset={-offset}
          />
        );
        offset += len;
        return el;
      })}
    </svg>
  );
}

export function HeroVisual() {
  const { line, area } = chartPaths();

  return (
    <div
      id="solutions"
      className={`relative mx-auto w-full max-w-[640px] scroll-mt-28 xl:max-w-none ${
        ATHLETE_AVAILABLE ? "pt-[46%] xl:pt-[40%]" : "pt-0"
      }`}
    >
      {/* Athlete backdrop */}
      <div
        aria-hidden
        className="dg-athlete-backdrop pointer-events-none absolute right-0 top-0 aspect-square w-[90%]"
      >
        <div className="absolute inset-0 rounded-full bg-lp-gold/[0.08] blur-[90px]" />
        {ATHLETE_AVAILABLE && (
          <Image
            src={ATHLETE_SRC}
            alt=""
            fill
            priority
            sizes="(min-width: 1280px) 30vw, 60vw"
            className="object-cover object-[62%_0%]"
          />
        )}
      </div>

      {/* Dashboard mock */}
      <div
        role="img"
        aria-label="DarkGoldGym dashboard preview showing members, attendance, revenue and trainers"
        className="relative z-10 ml-[6%] overflow-hidden rounded-2xl border border-lp-gold/45 bg-[#0B0A08]/95 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9),0_0_60px_-18px_rgba(245,179,35,0.35)] backdrop-blur-sm xl:[transform:perspective(1800px)_rotateY(-5deg)_rotateX(1.5deg)]"
      >
        <div className="flex">
          {/* Sidebar */}
          <aside className="hidden w-[118px] shrink-0 border-r border-white/[0.06] p-3 sm:block">
            <div className="mb-4 flex items-center gap-1.5 text-[11px] font-bold text-lp-ink">
              <Dumbbell className="size-3.5 text-lp-gold" aria-hidden />
              Dark<span className="text-lp-gold">Gold</span>Gym
            </div>
            <ul className="space-y-0.5">
              {NAV.map(({ label, icon: Icon, active }) => (
                <li
                  key={label}
                  className={`flex items-center gap-2 rounded-md px-2 py-[5px] text-[8.5px] font-medium ${
                    active
                      ? "border border-lp-gold/40 bg-lp-gold/10 text-lp-gold-highlight"
                      : "text-lp-muted"
                  }`}
                >
                  <Icon className="size-3 shrink-0" aria-hidden />
                  {label}
                </li>
              ))}
            </ul>
          </aside>

          {/* Main */}
          <div className="min-w-0 flex-1 p-3">
            <div className="mb-3 flex items-center justify-end gap-3 text-lp-muted">
              <span className="flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[8px]">
                <CalendarDays className="size-2.5" aria-hidden /> May 1 – May 31, 2024
              </span>
              <Search className="size-3" aria-hidden />
              <Bell className="size-3" aria-hidden />
              <span className="flex items-center gap-1.5">
                <span className="size-4 rounded-full bg-lp-gold/80" />
                <span className="text-[8px] leading-[10px] text-lp-ink">
                  John Doe
                  <br />
                  <span className="text-lp-muted">Admin</span>
                </span>
              </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {STATS.map((s) => (
                <div key={s.label} className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-2.5">
                  <p className="text-[8px] text-lp-muted">{s.label}</p>
                  <p className="mt-0.5 text-[15px] font-bold leading-5 text-lp-ink">{s.value}</p>
                  <p className="text-[7.5px] text-emerald-400">{s.delta}</p>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="mt-2 grid gap-2 sm:grid-cols-[1.25fr_1fr]">
              <div
                id="revenue-preview"
                className="scroll-mt-28 rounded-lg border border-white/[0.07] bg-white/[0.02] p-2.5"
              >
                <div className="flex items-start justify-between">
                  <p className="text-[9px] font-semibold text-lp-ink">Revenue Overview</p>
                  <p className="text-[13px] font-bold text-lp-ink">₹8,45,000</p>
                </div>
                <svg viewBox="0 0 300 100" preserveAspectRatio="none" className="mt-1 h-[86px] w-full" aria-hidden>
                  <defs>
                    <linearGradient id="dg-area" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#F5B323" stopOpacity="0.55" />
                      <stop offset="100%" stopColor="#F5B323" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[20, 45, 70].map((y) => (
                    <line key={y} x1="0" x2="300" y1={y} y2={y} stroke="rgba(255,255,255,0.06)" />
                  ))}
                  <path d={area} fill="url(#dg-area)" />
                  <path d={line} fill="none" stroke="#F5B323" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
                </svg>
                <div className="mt-1 flex justify-between text-[7px] text-lp-muted">
                  {["May 1", "May 8", "May 15", "May 22", "May 31"].map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </div>
              </div>

              <div
                id="membership-preview"
                className="scroll-mt-28 rounded-lg border border-white/[0.07] bg-white/[0.02] p-2.5"
              >
                <p className="text-[9px] font-semibold text-lp-ink">Membership Status</p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="relative">
                    <Donut />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[12px] font-bold leading-3 text-lp-ink">2,450</span>
                      <span className="text-[6.5px] text-lp-muted">Total Members</span>
                    </div>
                  </div>
                  <ul className="space-y-1.5">
                    {MEMBERSHIP.map((m) => (
                      <li key={m.label} className="flex items-center gap-1.5 text-[8px] text-lp-muted">
                        <span className="size-1.5 rounded-full" style={{ background: m.color }} />
                        {m.label}
                        <span className="ml-1 text-lp-ink">
                          {m.count} ({m.pct}%)
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Lists */}
            <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1.25fr]">
              <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-2.5">
                <div className="mb-1.5 flex justify-between text-[9px]">
                  <span className="font-semibold text-lp-ink">Recent Members</span>
                  <span className="text-lp-gold">View All</span>
                </div>
                <ul className="space-y-1.5">
                  {MEMBERS.map((m) => (
                    <li key={m.name} className="flex items-center gap-2 text-[8px]">
                      <span className="grid size-5 place-items-center rounded-full bg-lp-gold/20 text-[8px] font-bold text-lp-gold-highlight">
                        {m.name[0]}
                      </span>
                      <span className="flex-1 leading-[10px] text-lp-ink">
                        {m.name}
                        <br />
                        <span className="text-lp-muted">{m.plan}</span>
                      </span>
                      <span className="text-lp-muted">{m.date}</span>
                      <ChevronRight className="size-2.5 text-lp-muted" aria-hidden />
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-2.5">
                <div className="mb-1.5 flex justify-between text-[9px]">
                  <span className="font-semibold text-lp-ink">Latest Transactions</span>
                  <span className="text-lp-gold">View All</span>
                </div>
                <ul className="space-y-1.5">
                  {TRANSACTIONS.map((t) => (
                    <li key={t.name} className="flex items-center gap-2 text-[8px]">
                      <span className="grid size-5 place-items-center rounded-md bg-white/[0.06]">
                        <Wallet className="size-2.5 text-lp-gold" aria-hidden />
                      </span>
                      <span className="flex-1 leading-[10px] text-lp-ink">
                        {t.name}
                        <br />
                        <span className="text-lp-muted">{t.sub}</span>
                      </span>
                      <span className="font-semibold text-emerald-400">{t.amount}</span>
                      <span className="text-lp-muted">{t.date}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
