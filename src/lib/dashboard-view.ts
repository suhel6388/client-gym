import type {
  DashboardReport,
  MemberDto,
  MembershipWithRelationsDto,
  PaymentDto,
} from "./api";
import { formatCurrency, formatNumber } from "./format";
import type { BadgeTone } from "./member-ui";
import { getInitials } from "./members-api";
import {
  isSuccessful,
  paymentModeLabel,
  paymentStatusLabel,
  paymentStatusTone,
  toDateKey,
} from "./payments-view";

const DAY_MS = 24 * 60 * 60 * 1000;
const REVENUE_MONTHS = 12;
const SPARK_MONTHS = 8;
const GROWTH_MONTHS = 7;
const EXPIRING_DAYS = 7;
const UPCOMING_DAYS = 30;
const RECENT_PAYMENTS_LIMIT = 7;

const MIX_COLORS = ["#F6D477", "#E8B84D", "#B8862D", "#8A6520", "#6B4E18"];

export type DashboardKpiIcon =
  | "members"
  | "active"
  | "expiring"
  | "revenue"
  | "collected";

export type DashboardTrend = {
  value: number;
  favorable: boolean;
};

export type DashboardKpi = {
  id: string;
  label: string;
  value: string;
  helper: string;
  icon: DashboardKpiIcon;
  trend: DashboardTrend;
  spark: number[];
};

export type RevenuePoint = {
  month: string;
  revenue: number;
  previous: number;
};

export type MixSlice = {
  name: string;
  value: number;
  color: string;
};

export type GrowthPoint = {
  month: string;
  joined: number;
  left: number;
};

export type Expiration = {
  id: string;
  member: string;
  initials: string;
  plan: string;
  expiresOn: string;
  daysLeft: number;
  elapsed: number;
};

export type RecentPayment = {
  id: string;
  member: string;
  initials: string;
  plan: string;
  amount: number;
  method: string;
  date: string;
  status: string;
  tone: BadgeTone;
};

export type DashboardView = {
  kpis: DashboardKpi[];
  revenueSeries: RevenuePoint[];
  revenueStats: {
    avgRevenue: number;
    bestMonth: RevenuePoint;
    yoyGrowth: number | null;
  };
  membershipMix: MixSlice[];
  growthSeries: GrowthPoint[];
  expirations: Expiration[];
  recentPayments: RecentPayment[];
  summary: {
    monthlyRevenue: number;
    collectedToday: number;
    activeMemberships: number;
    totalMembers: number;
  };
};

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short" });
}

function percentageChange(current: number, previous: number): number {
  if (previous <= 0) return 0;
  return ((current - previous) / previous) * 100;
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function paymentDate(payment: PaymentDto): Date | null {
  return parseDate(payment.paymentDate) ?? parseDate(payment.paidAt);
}

function billingCycleLabel(months: number): string {
  if (months === 12) return "Annual";
  if (months === 6) return "Half-yearly";
  if (months === 3) return "Quarterly";
  if (months === 1) return "Monthly";
  return `${months} months`;
}

function membershipActiveAt(
  membership: MembershipWithRelationsDto,
  at: Date,
): boolean {
  const start = parseDate(membership.startDate);
  const end = parseDate(membership.endDate);
  if (!start || !end) return false;
  if (start > at || end < at) return false;

  if (membership.status === "CANCELLED") {
    const cancelled = parseDate(membership.cancelledAt);
    if (cancelled && cancelled <= at) return false;
  }

  return true;
}

function churnDate(membership: MembershipWithRelationsDto): Date | null {
  const cancelled = parseDate(membership.cancelledAt);
  if (cancelled) return cancelled;
  if (membership.effectiveStatus === "EXPIRED") {
    return parseDate(membership.endDate);
  }
  return null;
}

/**
 * Builds the API-backed dashboard view model from raw records.
 *
 * The backend caps list endpoints (`/payments` and `/memberships` at 200 rows,
 * `/members` at 500). Counts that the dashboard report exposes are treated as
 * authoritative; list-derived trends are therefore anchored to those counts.
 */
export function buildDashboardView(input: {
  report: DashboardReport;
  payments: PaymentDto[];
  memberships: MembershipWithRelationsDto[];
  members: MemberDto[];
}): DashboardView {
  const { report, payments, memberships, members } = input;
  const now = new Date();
  const currentMonth = startOfMonth(now);
  const previousMonth = addMonths(currentMonth, -1);

  /* -- Revenue ------------------------------------------------------------ */

  const revenueByMonth = new Map<string, number>();
  const dailyRevenue = new Map<string, { total: number; count: number }>();

  for (const payment of payments) {
    if (!isSuccessful(payment)) continue;
    const date = paymentDate(payment);
    if (!date) continue;

    const key = monthKey(date);
    revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + payment.amount);

    const dayKey = toDateKey(date);
    const day = dailyRevenue.get(dayKey) ?? { total: 0, count: 0 };
    day.total += payment.amount;
    day.count += 1;
    dailyRevenue.set(dayKey, day);
  }

  const revenueSeries: RevenuePoint[] = Array.from(
    { length: REVENUE_MONTHS },
    (_, index) => {
      const date = addMonths(startOfMonth(now), index - (REVENUE_MONTHS - 1));
      const previousYear = addMonths(date, -12);
      return {
        month: monthLabel(date),
        revenue: (revenueByMonth.get(monthKey(date)) ?? 0) / 100,
        previous: (revenueByMonth.get(monthKey(previousYear)) ?? 0) / 100,
      };
    },
  );

  const monthlyRevenue = (revenueByMonth.get(monthKey(currentMonth)) ?? 0) / 100;
  const previousMonthRevenue =
    (revenueByMonth.get(monthKey(previousMonth)) ?? 0) / 100;

  const totalRevenue = revenueSeries.reduce((sum, point) => sum + point.revenue, 0);
  const totalPrevious = revenueSeries.reduce(
    (sum, point) => sum + point.previous,
    0,
  );
  const bestMonth = revenueSeries.reduce((best, point) =>
    point.revenue > best.revenue ? point : best,
  );

  const revenueSpark = Array.from({ length: SPARK_MONTHS }, (_, index) => {
    const date = addMonths(startOfMonth(now), index - (SPARK_MONTHS - 1));
    return (revenueByMonth.get(monthKey(date)) ?? 0) / 100;
  });

  const collectedToday = report.collectedTodayPaise / 100;
  const todayKey = toDateKey(now);
  const yesterdayKey = toDateKey(new Date(now.getTime() - DAY_MS));
  const todayPayments = dailyRevenue.get(todayKey) ?? { total: 0, count: 0 };
  const yesterdayRevenue = (dailyRevenue.get(yesterdayKey)?.total ?? 0) / 100;

  const collectionsSpark = Array.from({ length: SPARK_MONTHS }, (_, index) => {
    const date = new Date(now.getTime() - (SPARK_MONTHS - 1 - index) * DAY_MS);
    const key = toDateKey(date);
    if (key === todayKey) return collectedToday;
    return (dailyRevenue.get(key)?.total ?? 0) / 100;
  });

  /* -- Members ------------------------------------------------------------ */

  const joinedDates = members
    .map((member) => parseDate(member.joinedAt))
    .filter((date): date is Date => date !== null);
  const joinedLast30Days = joinedDates.filter(
    (date) => date.getTime() >= now.getTime() - 30 * DAY_MS,
  ).length;
  const previousTotalMembers = Math.max(
    0,
    report.totalMembers - joinedLast30Days,
  );

  const memberSpark = Array.from({ length: SPARK_MONTHS }, (_, index) => {
    const month = addMonths(startOfMonth(now), index - (SPARK_MONTHS - 1));
    const at = endOfMonth(month).getTime() >= now.getTime() ? now : endOfMonth(month);
    const joinedAfter = joinedDates.filter((date) => date > at).length;
    return Math.max(0, report.totalMembers - joinedAfter);
  });

  /* -- Memberships -------------------------------------------------------- */

  const activeSpark = Array.from({ length: SPARK_MONTHS }, (_, index) => {
    const month = addMonths(startOfMonth(now), index - (SPARK_MONTHS - 1));
    const at = endOfMonth(month).getTime() >= now.getTime() ? now : endOfMonth(month);
    return memberships.filter((membership) => membershipActiveAt(membership, at))
      .length;
  });
  // The report endpoint is the source of truth for the current count; anchor
  // the sparkline to it so the card and the chart never disagree.
  if (activeSpark.length > 0) {
    activeSpark[activeSpark.length - 1] = report.activeMemberships;
  }

  const previousActiveCount = memberships.filter((membership) =>
    membershipActiveAt(membership, endOfMonth(previousMonth)),
  ).length;

  const previousExpiringCutoff = new Date(now.getTime() - EXPIRING_DAYS * DAY_MS);
  const expiringThisWeek = report.membershipsExpiringIn7Days;
  const expiringPreviousWeek = memberships.filter((membership) => {
    const end = parseDate(membership.endDate);
    return (
      end !== null &&
      end >= previousExpiringCutoff &&
      end < now &&
      membership.effectiveStatus === "EXPIRED"
    );
  }).length;
  const expiringTrend = percentageChange(
    expiringThisWeek,
    expiringPreviousWeek,
  );

  const expiringSpark = Array.from({ length: SPARK_MONTHS }, (_, index) => {
    const from = new Date(now.getTime() + index * EXPIRING_DAYS * DAY_MS);
    const to = new Date(now.getTime() + (index + 1) * EXPIRING_DAYS * DAY_MS);
    return memberships.filter((membership) => {
      const end = parseDate(membership.endDate);
      return (
        end !== null &&
        end >= from &&
        end < to &&
        membership.effectiveStatus === "ACTIVE"
      );
    }).length;
  });

  /* -- KPI cards ---------------------------------------------------------- */

  const kpis: DashboardKpi[] = [
    {
      id: "total-members",
      label: "Total Members",
      value: formatNumber(report.totalMembers),
      helper:
        joinedLast30Days > 0
          ? `${formatNumber(joinedLast30Days)} joined in the last 30 days`
          : "No new members in the last 30 days",
      icon: "members",
      trend: {
        value: percentageChange(report.totalMembers, previousTotalMembers),
        favorable: true,
      },
      spark: memberSpark,
    },
    {
      id: "active-memberships",
      label: "Active Memberships",
      value: formatNumber(report.activeMemberships),
      helper:
        report.totalMembers > 0
          ? `${((report.activeMemberships / report.totalMembers) * 100).toFixed(1)}% of total members`
          : "No members yet",
      icon: "active",
      trend: {
        value: percentageChange(report.activeMemberships, previousActiveCount),
        favorable: true,
      },
      spark: activeSpark,
    },
    {
      id: "expiring-memberships",
      label: "Expiring in 7 Days",
      value: formatNumber(report.membershipsExpiringIn7Days),
      helper: "Renewals due this week",
      icon: "expiring",
      trend: {
        value: expiringTrend,
        favorable: expiringTrend <= 0,
      },
      spark: expiringSpark,
    },
    {
      id: "monthly-revenue",
      label: "Monthly Revenue",
      value: formatCurrency(monthlyRevenue),
      helper:
        previousMonthRevenue > 0
          ? `vs ${formatCurrency(previousMonthRevenue)} last month`
          : "No revenue recorded last month",
      icon: "revenue",
      trend: {
        value: percentageChange(monthlyRevenue, previousMonthRevenue),
        favorable: true,
      },
      spark: revenueSpark,
    },
    {
      id: "collected-today",
      label: "Collected Today",
      value: formatCurrency(collectedToday),
      helper: `${formatNumber(todayPayments.count)} payment${
        todayPayments.count === 1 ? "" : "s"
      } today`,
      icon: "collected",
      trend: {
        value: percentageChange(collectedToday, yesterdayRevenue),
        favorable: true,
      },
      spark: collectionsSpark,
    },
  ];

  /* -- Membership distribution ------------------------------------------- */

  const mix = new Map<string, number>();
  for (const membership of memberships) {
    if (membership.effectiveStatus !== "ACTIVE") continue;
    const end = parseDate(membership.endDate);
    if (!end || end < now) continue;
    const label = billingCycleLabel(membership.plan.durationMonths);
    mix.set(label, (mix.get(label) ?? 0) + 1);
  }

  const membershipMix: MixSlice[] = [...mix.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], index) => ({
      name,
      value,
      color: MIX_COLORS[index % MIX_COLORS.length],
    }));

  /* -- Membership growth -------------------------------------------------- */

  const growthSeries: GrowthPoint[] = Array.from(
    { length: GROWTH_MONTHS },
    (_, index) => {
      const month = addMonths(startOfMonth(now), index - (GROWTH_MONTHS - 1));
      const from = month.getTime();
      const to = endOfMonth(month).getTime();
      const joined = memberships.filter((membership) => {
        const start = parseDate(membership.startDate);
        return start !== null && start.getTime() >= from && start.getTime() <= to;
      }).length;
      const left = memberships.filter((membership) => {
        const date = churnDate(membership);
        return date !== null && date.getTime() >= from && date.getTime() <= to;
      }).length;
      return { month: monthLabel(month), joined, left };
    },
  );

  /* -- Upcoming expirations ---------------------------------------------- */

  const upcomingCutoff = new Date(now.getTime() + UPCOMING_DAYS * DAY_MS);
  const expirations: Expiration[] = memberships
    .filter((membership) => {
      if (membership.effectiveStatus !== "ACTIVE") return false;
      const end = parseDate(membership.endDate);
      return end !== null && end >= now && end <= upcomingCutoff;
    })
    .sort((a, b) => {
      const aEnd = parseDate(a.endDate)?.getTime() ?? 0;
      const bEnd = parseDate(b.endDate)?.getTime() ?? 0;
      return aEnd - bEnd;
    })
    .slice(0, 5)
    .map((membership) => {
      const start = parseDate(membership.startDate) ?? now;
      const end = parseDate(membership.endDate) ?? now;
      const span = end.getTime() - start.getTime();
      const elapsed =
        span > 0
          ? Math.max(
              0,
              Math.min(100, ((now.getTime() - start.getTime()) / span) * 100),
            )
          : 100;
      return {
        id: membership.id,
        member: membership.member.name,
        initials: getInitials(membership.member.name),
        plan: membership.plan.name,
        expiresOn: toDateKey(end),
        daysLeft: Math.max(
          0,
          Math.ceil((end.getTime() - now.getTime()) / DAY_MS),
        ),
        elapsed: Math.round(elapsed),
      };
    });

  /* -- Recent payments ---------------------------------------------------- */

  const planByMember = new Map<string, { name: string; end: number }>();
  for (const member of members) {
    const latest = member.memberships?.[0];
    if (!latest) continue;
    const end = parseDate(latest.endDate)?.getTime() ?? 0;
    planByMember.set(member.id, {
      name: latest.plan?.name ?? "—",
      end,
    });
  }
  for (const membership of memberships) {
    const end = parseDate(membership.endDate)?.getTime() ?? 0;
    const existing = planByMember.get(membership.memberId);
    if (!existing || end > existing.end) {
      planByMember.set(membership.memberId, {
        name: membership.plan.name,
        end,
      });
    }
  }

  const recentPayments: RecentPayment[] = [...payments]
    .sort((a, b) => {
      const aDate = paymentDate(a)?.getTime() ?? 0;
      const bDate = paymentDate(b)?.getTime() ?? 0;
      return bDate - aDate;
    })
    .slice(0, RECENT_PAYMENTS_LIMIT)
    .map((payment) => {
      const date = paymentDate(payment) ?? now;
      return {
        id: payment.receiptNumber || payment.id,
        member: payment.member?.name ?? "Unknown member",
        initials: getInitials(payment.member?.name ?? "?"),
        plan: planByMember.get(payment.memberId)?.name ?? "—",
        amount: payment.amount / 100,
        method: paymentModeLabel(payment.paymentMode),
        date: toDateKey(date),
        status: paymentStatusLabel(payment.status),
        tone: paymentStatusTone(payment.status),
      };
    });

  return {
    kpis,
    revenueSeries,
    revenueStats: {
      avgRevenue: totalRevenue / revenueSeries.length,
      bestMonth,
      yoyGrowth:
        totalPrevious > 0
          ? ((totalRevenue - totalPrevious) / totalPrevious) * 100
          : null,
    },
    membershipMix,
    growthSeries,
    expirations,
    recentPayments,
    summary: {
      monthlyRevenue,
      collectedToday,
      activeMemberships: report.activeMemberships,
      totalMembers: report.totalMembers,
    },
  };
}
