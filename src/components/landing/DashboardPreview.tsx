import {
  ArrowUpRight,
  Bell,
  CalendarCheck,
  ChartColumn,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Dumbbell,
  Ellipsis,
  LayoutDashboard,
  Lock,
  MessageSquare,
  Search,
  Settings,
  TrendingUp,
  UserCog,
  Users,
  Wallet,
  CalendarDays,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type SidebarItem = {
  label: string;
  icon: LucideIcon;
  active?: boolean;
};

const SIDEBAR_ITEMS: SidebarItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Members", icon: Users },
  { label: "Attendance", icon: CalendarCheck },
  { label: "Trainers", icon: UserCog },
  { label: "Workouts", icon: Dumbbell },
  { label: "Payments", icon: Wallet },
  { label: "Plans", icon: CreditCard },
  { label: "Reports", icon: ChartColumn },
  { label: "Messages", icon: MessageSquare },
  { label: "Settings", icon: Settings },
];

type Metric = {
  label: string;
  value: string;
  delta: string;
  note: string;
  icon: LucideIcon;
};

const METRICS: Metric[] = [
  {
    label: "Total Members",
    value: "2,847",
    delta: "+12.5%",
    note: "vs last month",
    icon: Users,
  },
  {
    label: "Attendance Today",
    value: "186",
    delta: "+8.2%",
    note: "vs yesterday",
    icon: CalendarDays,
  },
  {
    label: "Monthly Revenue",
    value: "₹12.48L",
    delta: "+18.4%",
    note: "vs last month",
    icon: Wallet,
  },
  {
    label: "Active Trainers",
    value: "24",
    delta: "+2",
    note: "this quarter",
    icon: UserCog,
  },
];

const RECENT_MEMBERS = [
  {
    initials: "AS",
    name: "Ayaan Sharma",
    plan: "Gold Annual",
    status: "Active",
    tone: "gold",
  },
  {
    initials: "PN",
    name: "Priya Nair",
    plan: "Monthly",
    status: "Active",
    tone: "bronze",
  },
  {
    initials: "RM",
    name: "Rohan Mehta",
    plan: "Quarterly",
    status: "Expiring",
    tone: "neutral",
  },
];

const TRANSACTIONS = [
  {
    name: "Priya Nair",
    meta: "UPI · Today, 10:42",
    amount: "₹3,500",
    status: "Paid",
  },
  {
    name: "Ayaan Sharma",
    meta: "Card · Today, 09:18",
    amount: "₹12,000",
    status: "Paid",
  },
  {
    name: "Neha Kapoor",
    meta: "Cash · Yesterday",
    amount: "₹2,200",
    status: "Pending",
  },
];

const MEMBERSHIP_LEGEND = [
  { label: "Active", value: "2,156", color: "#F5B323" },
  { label: "Expiring", value: "228", color: "#8F7128" },
  { label: "Inactive", value: "463", color: "#3A3B3C" },
];

/** Doughnut geometry: circumference = 2 * π * 38 ≈ 238.76. */
const DONUT_CIRCUMFERENCE = 238.76;

const memberTone = {
  gold: "border-lp-gold/20 bg-lp-gold/15 text-lp-gold",
  bronze: "border-[#d9b85a]/15 bg-[#8d711f]/20 text-[#e6c76b]",
  neutral: "border-white/10 bg-white/[0.055] text-white/60",
} as const;

export function DashboardPreview() {
  return (
    <figure
      aria-labelledby="dashboard-preview-caption"
      className="relative mx-auto w-full max-w-[680px] xl:mx-0 xl:max-w-none"
    >
      <figcaption id="dashboard-preview-caption" className="sr-only">
        Preview of the DarkGoldGym CRM dashboard, showing member totals,
        attendance, monthly revenue, active trainers, revenue trends, membership
        status, recent members and latest transactions.
      </figcaption>

      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-10 inset-y-4 -z-10 rounded-[3rem] bg-[radial-gradient(ellipse_at_center,rgba(245,179,35,0.13),transparent_66%)] blur-2xl"
      />

      <div aria-hidden className="dg-dark-preview dg-preview-shell relative">
        <div className="dg-preview-tilt relative rounded-[22px] border border-lp-gold/25 bg-[#0d0e0f] p-1.5 shadow-[0_45px_110px_-30px_rgba(0,0,0,0.95),0_0_70px_-28px_rgba(245,179,35,0.38)]">
          <span className="pointer-events-none absolute inset-x-14 top-0 z-10 h-px bg-gradient-to-r from-transparent via-lp-gold/55 to-transparent" />

          <div className="overflow-hidden rounded-[16px] border border-white/[0.055] bg-[#0a0b0c]">
            {/* Browser chrome */}
            <div className="grid h-7 grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-white/[0.055] bg-lp-card px-3">
              <div className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-[#3a3b3c]" />
                <span className="size-1.5 rounded-full bg-[#2f3031]" />
                <span className="size-1.5 rounded-full bg-[#252627]" />
              </div>
              <div className="flex min-w-0 items-center gap-1.5 rounded-md border border-white/[0.055] bg-black/25 px-2.5 py-1 text-[7.5px] text-white/35">
                <Lock className="size-2.5 shrink-0 text-lp-gold/55" strokeWidth={1.9} />
                <span className="truncate">app.darkgoldgym.com/dashboard</span>
              </div>
              <div className="flex items-center justify-end gap-2">
                <span className="hidden items-center gap-1 text-[6.5px] font-semibold uppercase tracking-[0.14em] text-lp-gold/65 sm:flex">
                  <span className="size-1 rounded-full bg-lp-gold shadow-[0_0_6px_rgba(245,179,35,0.85)]" />
                  Live
                </span>
                <Ellipsis className="size-3 text-white/20" strokeWidth={1.8} />
              </div>
            </div>

            {/* Product surface */}
            <div className="dg-dashboard flex min-w-0 bg-[#0a0b0c]">
              <aside className="dg-preview-sidebar min-w-0 flex-col border-r border-white/[0.055] bg-[#0e0f10] p-2">
                <div className="flex items-center gap-1.5 px-1.5 pb-3 pt-0.5">
                  <span className="grid size-5 place-items-center rounded-md bg-[linear-gradient(135deg,#FFD15C,#F5B323)] text-[#171203]">
                    <Dumbbell className="size-2.5" strokeWidth={2.2} />
                  </span>
                  <span className="truncate text-[7.5px] font-extrabold uppercase tracking-[0.14em] text-white">
                    DarkGold
                  </span>
                </div>

                <nav className="flex flex-col gap-0.5">
                  {SIDEBAR_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <span
                        key={item.label}
                        className={
                          item.active
                            ? "flex items-center gap-1.5 rounded-md bg-lp-gold/[0.09] px-1.5 py-[5px] text-[7.5px] font-medium text-lp-gold"
                            : "flex items-center gap-1.5 rounded-md px-1.5 py-[5px] text-[7.5px] font-medium text-white/38"
                        }
                      >
                        <Icon
                          className="size-2.5 shrink-0"
                          strokeWidth={1.8}
                          aria-hidden
                        />
                        <span className="truncate">{item.label}</span>
                      </span>
                    );
                  })}
                </nav>

                <div className="mt-auto hidden rounded-lg border border-lp-gold/20 bg-lp-gold/[0.05] p-2 xl:block">
                  <p className="text-[6.5px] font-semibold uppercase tracking-[0.12em] text-lp-gold/80">
                    Growth plan
                  </p>
                  <p className="mt-1 text-[6.5px] leading-[1.4] text-white/35">
                    7,200 members included
                  </p>
                  <div className="mt-1.5 h-0.5 overflow-hidden rounded-full bg-white/[0.07]">
                    <span className="block h-full w-[64%] rounded-full bg-lp-gold/70" />
                  </div>
                </div>
              </aside>

              <div className="min-w-0 flex-1 p-2.5">
                <header className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[6.5px] uppercase tracking-[0.16em] text-white/30">
                      Thursday, 22 Oct
                    </p>
                    <h3 className="mt-0.5 truncate text-[12px] font-semibold leading-tight text-white">
                      Dashboard
                    </h3>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="hidden items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.025] px-2 py-1 text-[7px] text-white/30 md:flex">
                      <Search className="size-2.5" strokeWidth={1.8} />
                      Search
                    </span>
                    <span className="relative grid size-6 place-items-center rounded-md border border-white/[0.06] bg-white/[0.025] text-white/35">
                      <Bell className="size-2.5" strokeWidth={1.8} />
                      <span className="absolute right-1 top-1 size-1 rounded-full bg-lp-gold" />
                    </span>
                    <span className="grid size-6 place-items-center rounded-full border border-lp-gold/20 bg-lp-gold/15 text-[6.5px] font-bold text-lp-gold">
                      AS
                    </span>
                  </div>
                </header>

                <div className="dg-metrics-grid mt-2.5">
                  {METRICS.map((metric) => {
                    const Icon = metric.icon;
                    return (
                      <div
                        key={metric.label}
                        className="min-w-0 rounded-lg border border-white/[0.06] bg-lp-card p-2"
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="truncate text-[7px] font-medium text-white/38">
                            {metric.label}
                          </span>
                          <Icon
                            className="dg-metric-icon size-2.5 shrink-0 text-lp-gold/65"
                            strokeWidth={1.8}
                          />
                        </div>
                        <p className="mt-1 truncate text-[15px] font-semibold leading-none tracking-[-0.02em] tabular-nums text-white">
                          {metric.value}
                        </p>
                        <p className="mt-1 flex items-center gap-1 truncate text-[6.5px] leading-none">
                          <span className="flex items-center gap-0.5 font-semibold text-[#71D7A0]">
                            <ArrowUpRight className="size-2" strokeWidth={2.3} />
                            {metric.delta}
                          </span>
                          <span className="truncate text-white/25">{metric.note}</span>
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="dg-insight-grid mt-2.5">
                  {/* Revenue chart */}
                  <section
                    id="revenue-preview"
                    className="min-w-0 scroll-mt-28 rounded-xl border border-white/[0.06] bg-lp-card p-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[7px] font-medium text-white/35">
                          Revenue overview
                        </p>
                        <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                          <span className="text-[14px] font-semibold leading-none tracking-[-0.02em] tabular-nums text-white">
                            ₹12,48,500
                          </span>
                          <span className="flex items-center gap-0.5 text-[6.5px] font-semibold text-[#71D7A0]">
                            <TrendingUp className="size-2" strokeWidth={2.2} />
                            18.4%
                          </span>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-md border border-white/[0.06] bg-white/[0.02] px-1.5 py-0.5 text-[6px] font-medium text-white/30">
                        6 months
                      </span>
                    </div>

                    <svg
                      viewBox="0 0 320 100"
                      preserveAspectRatio="none"
                      className="mt-2 h-[80px] w-full overflow-visible"
                      role="img"
                      aria-label="Revenue trending upward over the last six months"
                    >
                      <defs>
                        <linearGradient id="dg-revenue-fill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#F5B323" stopOpacity="0.28" />
                          <stop offset="100%" stopColor="#F5B323" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="dg-revenue-line" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#D89A28" />
                          <stop offset="55%" stopColor="#F5B323" />
                          <stop offset="100%" stopColor="#FFD15C" />
                        </linearGradient>
                      </defs>
                      {[18, 45, 72].map((y) => (
                        <line
                          key={y}
                          x1="0"
                          x2="320"
                          y1={y}
                          y2={y}
                          stroke="rgba(255,255,255,0.05)"
                          strokeWidth="0.6"
                          strokeDasharray="2 4"
                          vectorEffect="non-scaling-stroke"
                        />
                      ))}
                      <path
                        d="M0,84 C22,80 38,76 58,69 C82,61 96,68 118,56 C138,45 154,49 174,38 C196,26 216,35 238,23 C260,12 286,17 316,8 L320,100 L0,100 Z"
                        fill="url(#dg-revenue-fill)"
                      />
                      <path
                        d="M0,84 C22,80 38,76 58,69 C82,61 96,68 118,56 C138,45 154,49 174,38 C196,26 216,35 238,23 C260,12 286,17 316,8"
                        fill="none"
                        stroke="url(#dg-revenue-line)"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                      />
                      <path
                        d="M0,91 C38,87 62,84 94,78 C130,71 160,73 194,64 C228,55 260,58 316,48"
                        fill="none"
                        stroke="rgba(255,255,255,0.13)"
                        strokeWidth="0.8"
                        strokeDasharray="3 4"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                      />
                      <circle cx="316" cy="8" r="2.4" fill="#FFD15C" />
                      <circle cx="316" cy="8" r="5" fill="#F5B323" fillOpacity="0.18" />
                    </svg>

                    <div className="mt-0.5 flex justify-between text-[6px] font-medium text-white/25">
                      {["Apr", "May", "Jun", "Jul", "Aug", "Sep"].map((month) => (
                        <span key={month}>{month}</span>
                      ))}
                    </div>
                  </section>

                  {/* Membership donut */}
                  <section
                    id="membership-preview"
                    className="min-w-0 scroll-mt-28 rounded-xl border border-white/[0.06] bg-lp-card p-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[7px] font-medium text-white/35">
                        Membership status
                      </p>
                      <Ellipsis className="size-3 text-white/20" strokeWidth={1.8} />
                    </div>

                    <div className="mt-2.5 flex items-center gap-2.5">
                      <div className="relative size-[70px] shrink-0">
                        <svg viewBox="0 0 100 100" className="size-full -rotate-90">
                          <circle
                            cx="50"
                            cy="50"
                            r="38"
                            fill="none"
                            stroke="#242526"
                            strokeWidth="9"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="38"
                            fill="none"
                            stroke="#F5B323"
                            strokeWidth="9"
                            strokeLinecap="round"
                            strokeDasharray={`${DONUT_CIRCUMFERENCE * 0.76} ${DONUT_CIRCUMFERENCE}`}
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="38"
                            fill="none"
                            stroke="#8F7128"
                            strokeWidth="9"
                            strokeLinecap="round"
                            strokeDasharray={`${DONUT_CIRCUMFERENCE * 0.08} ${DONUT_CIRCUMFERENCE}`}
                            strokeDashoffset={-DONUT_CIRCUMFERENCE * 0.775}
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="38"
                            fill="none"
                            stroke="#3A3B3C"
                            strokeWidth="9"
                            strokeLinecap="round"
                            strokeDasharray={`${DONUT_CIRCUMFERENCE * 0.145} ${DONUT_CIRCUMFERENCE}`}
                            strokeDashoffset={-DONUT_CIRCUMFERENCE * 0.87}
                          />
                        </svg>
                        <span className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-[11px] font-semibold leading-none tabular-nums text-white">
                            2,847
                          </span>
                          <span className="mt-0.5 text-[5.5px] font-medium uppercase tracking-[0.12em] text-white/30">
                            Members
                          </span>
                        </span>
                      </div>

                      <ul className="min-w-0 flex-1 space-y-1.5">
                        {MEMBERSHIP_LEGEND.map((entry) => (
                          <li
                            key={entry.label}
                            className="flex min-w-0 items-center gap-1.5 text-[7px] leading-none"
                          >
                            <span
                              className="size-1.5 shrink-0 rounded-full"
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="min-w-0 flex-1 truncate text-white/35">
                              {entry.label}
                            </span>
                            <span className="shrink-0 font-semibold tabular-nums text-white/70">
                              {entry.value}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-3 flex items-center gap-1 border-t border-white/[0.055] pt-2 text-[6.5px] text-white/30">
                      <CheckCircle2 className="size-2.5 text-[#71D7A0]" strokeWidth={1.9} />
                      <span className="truncate">92% renewal rate this quarter</span>
                    </div>
                  </section>
                </div>

                <div id="activity-preview" className="dg-activity-grid mt-2.5 scroll-mt-28">
                  {/* Recent members */}
                  <section className="min-w-0 rounded-xl border border-white/[0.06] bg-lp-card p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[7px] font-medium text-white/35">Recent members</p>
                      <span className="flex items-center gap-0.5 text-[6px] text-lp-gold/60">
                        View all
                        <ChevronRight className="size-2" strokeWidth={2} />
                      </span>
                    </div>

                    <div className="mt-1.5 divide-y divide-white/[0.05]">
                      {RECENT_MEMBERS.map((member) => (
                        <div
                          key={member.name}
                          className="flex items-center justify-between gap-2 py-1"
                        >
                          <div className="flex min-w-0 items-center gap-1.5">
                            <span
                              className={`grid size-5 shrink-0 place-items-center rounded-full border text-[5.5px] font-bold ${memberTone[member.tone as keyof typeof memberTone]}`}
                            >
                              {member.initials}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-[7.5px] font-medium leading-tight text-white/75">
                                {member.name}
                              </p>
                              <p className="mt-0.5 truncate text-[6px] leading-none text-white/25">
                                {member.plan}
                              </p>
                            </div>
                          </div>
                          <span
                            className={
                              member.status === "Active"
                                ? "shrink-0 rounded-full border border-[#71D7A0]/15 bg-[#71D7A0]/[0.07] px-1.5 py-0.5 text-[5.5px] font-medium text-[#71D7A0]"
                                : "shrink-0 rounded-full border border-lp-gold/20 bg-lp-gold/[0.07] px-1.5 py-0.5 text-[5.5px] font-medium text-lp-gold/80"
                            }
                          >
                            {member.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Latest transactions */}
                  <section className="min-w-0 rounded-xl border border-white/[0.06] bg-lp-card p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[7px] font-medium text-white/35">
                        Latest transactions
                      </p>
                      <span className="rounded-md border border-white/[0.06] bg-white/[0.02] px-1.5 py-0.5 text-[6px] text-white/25">
                        Today
                      </span>
                    </div>

                    <div className="mt-1.5 divide-y divide-white/[0.05]">
                      {TRANSACTIONS.map((transaction) => (
                        <div
                          key={transaction.name}
                          className="flex items-center justify-between gap-2 py-1"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-[7.5px] font-medium leading-tight text-white/75">
                              {transaction.name}
                            </p>
                            <p className="mt-0.5 truncate text-[6px] leading-none text-white/25">
                              {transaction.meta}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-[7.5px] font-semibold leading-tight tabular-nums text-white/80">
                              {transaction.amount}
                            </p>
                            <p
                              className={
                                transaction.status === "Paid"
                                  ? "mt-0.5 text-[5.5px] leading-none text-[#71D7A0]"
                                  : "mt-0.5 text-[5.5px] leading-none text-lp-gold/75"
                              }
                            >
                              {transaction.status}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </figure>
  );
}
