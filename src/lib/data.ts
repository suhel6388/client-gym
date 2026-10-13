/* ---------------------------------------------------------------------------
   Sample data — mirrors the shape a real API would return so the UI can be
   wired up to a backend without touching the components.
   --------------------------------------------------------------------------- */

export type Trend = {
  /** Signed percentage change vs. the previous period. */
  value: number;
  /** Whether this movement is good news (drives the colour of the pill). */
  favorable: boolean;
};

export type KpiIcon =
  | "members"
  | "active"
  | "expired"
  | "revenue"
  | "pending";

export type Kpi = {
  id: string;
  label: string;
  value: string;
  helper: string;
  icon: KpiIcon;
  trend: Trend;
  /** 8-point sparkline series rendered inside the card. */
  spark: number[];
};

export const kpis: Kpi[] = [
  {
    id: "total-members",
    label: "Total Members",
    value: "2,847",
    helper: "vs. 2,530 last month",
    icon: "members",
    trend: { value: 12.5, favorable: true },
    spark: [1820, 1905, 2008, 2132, 2274, 2398, 2530, 2847],
  },
  {
    id: "active-memberships",
    label: "Active Memberships",
    value: "2,318",
    helper: "81.4% of total members",
    icon: "active",
    trend: { value: 8.2, favorable: true },
    spark: [1610, 1702, 1815, 1908, 2011, 2124, 2242, 2318],
  },
  {
    id: "expired-memberships",
    label: "Expired Memberships",
    value: "529",
    helper: "18.6% of total members",
    icon: "expired",
    trend: { value: -3.4, favorable: true },
    spark: [612, 598, 586, 571, 564, 552, 548, 529],
  },
  {
    id: "monthly-revenue",
    label: "Monthly Revenue",
    value: "$184,920",
    helper: "vs. $159,800 last month",
    icon: "revenue",
    trend: { value: 15.7, favorable: true },
    spark: [118000, 124000, 131000, 139000, 152000, 161000, 174000, 184920],
  },
  {
    id: "pending-payments",
    label: "Pending Payments",
    value: "$12,480",
    helper: "38 invoices outstanding",
    icon: "pending",
    trend: { value: 6.1, favorable: false },
    spark: [
      8600, 9100, 9800, 10400, 10900, 11250, 11760, 12480,
    ],
  },
];

/* -- Revenue Analytics ---------------------------------------------------- */

export type RevenuePoint = {
  month: string;
  revenue: number;
  previous: number;
};

export const revenueSeries: RevenuePoint[] = [
  { month: "Nov", revenue: 118000, previous: 96000 },
  { month: "Dec", revenue: 131500, previous: 104000 },
  { month: "Jan", revenue: 124000, previous: 108500 },
  { month: "Feb", revenue: 138200, previous: 112000 },
  { month: "Mar", revenue: 146500, previous: 119500 },
  { month: "Apr", revenue: 140800, previous: 124000 },
  { month: "May", revenue: 153900, previous: 131000 },
  { month: "Jun", revenue: 162400, previous: 138500 },
  { month: "Jul", revenue: 157600, previous: 142000 },
  { month: "Aug", revenue: 169300, previous: 149000 },
  { month: "Sep", revenue: 174800, previous: 155500 },
  { month: "Oct", revenue: 184920, previous: 159800 },
];

/* -- Membership distribution --------------------------------------------- */

export type MixSlice = {
  name: string;
  value: number;
  color: string;
};

export const membershipMix: MixSlice[] = [
  { name: "Annual", value: 1120, color: "#F6D477" },
  { name: "Monthly", value: 864, color: "#E8B84D" },
  { name: "Quarterly", value: 542, color: "#B8862D" },
  { name: "Student", value: 321, color: "#8A6520" },
];

/* -- Monthly membership growth ------------------------------------------- */

export type GrowthPoint = {
  month: string;
  joined: number;
  left: number;
};

export const growthSeries: GrowthPoint[] = [
  { month: "Apr", joined: 148, left: 42 },
  { month: "May", joined: 162, left: 38 },
  { month: "Jun", joined: 176, left: 51 },
  { month: "Jul", joined: 203, left: 44 },
  { month: "Aug", joined: 231, left: 39 },
  { month: "Sep", joined: 214, left: 47 },
  { month: "Oct", joined: 268, left: 35 },
];

/* -- Recent payments ------------------------------------------------------ */

export type PaymentStatus = "Paid" | "Pending" | "Failed" | "Refunded";

export type Payment = {
  id: string;
  member: string;
  initials: string;
  plan: string;
  amount: number;
  method: string;
  date: string;
  status: PaymentStatus;
};

export const recentPayments: Payment[] = [
  {
    id: "INV-10428",
    member: "Marcus Bennett",
    initials: "MB",
    plan: "Annual Pro",
    amount: 1299,
    method: "Visa •• 4291",
    date: "2026-10-13",
    status: "Paid",
  },
  {
    id: "INV-10427",
    member: "Elena Rodriguez",
    initials: "ER",
    plan: "Monthly Flex",
    amount: 89,
    method: "Apple Pay",
    date: "2026-10-13",
    status: "Paid",
  },
  {
    id: "INV-10426",
    member: "Devon Clarke",
    initials: "DC",
    plan: "Quarterly",
    amount: 279,
    method: "Mastercard •• 7742",
    date: "2026-10-12",
    status: "Pending",
  },
  {
    id: "INV-10425",
    member: "Priya Raman",
    initials: "PR",
    plan: "Annual Pro",
    amount: 1299,
    method: "Visa •• 1180",
    date: "2026-10-12",
    status: "Paid",
  },
  {
    id: "INV-10424",
    member: "Jonah Whitfield",
    initials: "JW",
    plan: "Student",
    amount: 49,
    method: "Bank transfer",
    date: "2026-10-11",
    status: "Failed",
  },
  {
    id: "INV-10423",
    member: "Amara Osei",
    initials: "AO",
    plan: "Monthly Flex",
    amount: 89,
    method: "Visa •• 6620",
    date: "2026-10-11",
    status: "Paid",
  },
  {
    id: "INV-10422",
    member: "Liam Castellano",
    initials: "LC",
    plan: "Quarterly",
    amount: 279,
    method: "Google Pay",
    date: "2026-10-10",
    status: "Refunded",
  },
];

/* -- Upcoming expirations ------------------------------------------------- */

export type Expiration = {
  id: string;
  member: string;
  initials: string;
  plan: string;
  expiresOn: string;
  daysLeft: number;
  /** Percentage of the current billing period already elapsed. */
  elapsed: number;
};

export const upcomingExpirations: Expiration[] = [
  {
    id: "MEM-2291",
    member: "Sofia Marchetti",
    initials: "SM",
    plan: "Monthly Flex",
    expiresOn: "2026-10-14",
    daysLeft: 1,
    elapsed: 97,
  },
  {
    id: "MEM-1184",
    member: "Tobias Reyes",
    initials: "TR",
    plan: "Quarterly",
    expiresOn: "2026-10-16",
    daysLeft: 3,
    elapsed: 90,
  },
  {
    id: "MEM-0773",
    member: "Hana Kobayashi",
    initials: "HK",
    plan: "Annual Pro",
    expiresOn: "2026-10-19",
    daysLeft: 6,
    elapsed: 85,
  },
  {
    id: "MEM-1902",
    member: "Gabriel Nwosu",
    initials: "GN",
    plan: "Monthly Flex",
    expiresOn: "2026-10-23",
    daysLeft: 10,
    elapsed: 72,
  },
  {
    id: "MEM-0455",
    member: "Clara Lindqvist",
    initials: "CL",
    plan: "Student",
    expiresOn: "2026-10-27",
    daysLeft: 14,
    elapsed: 58,
  },
];

/* -- Shell fixtures ------------------------------------------------------- */

export const notifications = [
  {
    id: "n1",
    title: "Payment received",
    body: "Marcus Bennett paid $1,299.00 for Annual Pro.",
    time: "4 min ago",
    tone: "success" as const,
  },
  {
    id: "n2",
    title: "Membership expiring",
    body: "Sofia Marchetti's plan expires tomorrow.",
    time: "1 hr ago",
    tone: "warning" as const,
  },
  {
    id: "n3",
    title: "Payment failed",
    body: "Jonah Whitfield's card was declined twice.",
    time: "3 hrs ago",
    tone: "danger" as const,
  },
];

export const currentUser = {
  name: "Marcus Cole",
  role: "Studio Owner",
  initials: "MC",
  email: "marcus@ironclad.fit",
};
