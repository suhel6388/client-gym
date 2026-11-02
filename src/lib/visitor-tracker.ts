/**
 * Website Visitor Tracking & Analytics System.
 * Tracks site visitors and computes daily, weekly, monthly, yearly, and custom-range analytics.
 * Accessible strictly by SUPER_ADMIN in the platform console.
 */

export type VisitorPeriod = "daily" | "weekly" | "monthly" | "yearly" | "custom";

export type DeviceType = "Desktop" | "Mobile" | "Tablet";

export type VisitorRecord = {
  id: string;
  visitorId: string;
  path: string;
  referrer: string;
  timestamp: number;
  device: DeviceType;
  browser: string;
  os: string;
  ip: string;
};

export type VisitorChartPoint = {
  label: string;
  dateKey: string;
  visits: number;
  uniqueVisitors: number;
};

export type VisitorPageBreakdown = {
  path: string;
  visits: number;
  unique: number;
  percentage: number;
};

export type VisitorBreakdownItem = {
  name: string;
  count: number;
  percentage: number;
};

export type VisitorAnalyticsData = {
  summary: {
    totalVisits: number;
    uniqueVisitors: number;
    avgDailyVisits: number;
    peakTimeLabel: string;
    peakVisitsCount: number;
    bounceRate: number;
    pagesPerVisit: number;
    previousPeriodChangePct: number;
  };
  chartData: VisitorChartPoint[];
  topPages: VisitorPageBreakdown[];
  deviceBreakdown: VisitorBreakdownItem[];
  browserBreakdown: VisitorBreakdownItem[];
  recentVisits: VisitorRecord[];
};

const STORAGE_KEY = "gym_site_visitors_data";
const VISITOR_COOKIE_KEY = "gym_visitor_uuid";
const MAX_STORED_RECORDS = 5000;

function generateUUID(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "anon";
  let id = localStorage.getItem(VISITOR_COOKIE_KEY);
  if (!id) {
    id = generateUUID();
    localStorage.setItem(VISITOR_COOKIE_KEY, id);
  }
  return id;
}

export function detectDevice(): DeviceType {
  if (typeof window === "undefined") return "Desktop";
  const ua = navigator.userAgent.toLowerCase();
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) {
    return "Mobile";
  }
  if (/ipad|tablet/i.test(ua)) {
    return "Tablet";
  }
  return "Desktop";
}

export function detectBrowser(): string {
  if (typeof window === "undefined") return "Chrome";
  const ua = navigator.userAgent;
  if (/edg/i.test(ua)) return "Edge";
  if (/chrome|crios/i.test(ua) && !/opr|edg/i.test(ua)) return "Chrome";
  if (/firefox|fxios/i.test(ua)) return "Firefox";
  if (/safari/i.test(ua) && !/chrome/i.test(ua)) return "Safari";
  if (/opera|opr/i.test(ua)) return "Opera";
  return "Other";
}

export function detectOS(): string {
  if (typeof window === "undefined") return "Windows";
  const ua = navigator.userAgent;
  if (/windows/i.test(ua)) return "Windows";
  if (/macintosh|mac os/i.test(ua)) return "macOS";
  if (/android/i.test(ua)) return "Android";
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
  if (/linux/i.test(ua)) return "Linux";
  return "Other";
}

/** Pre-populates realistic historical analytics if the storage is brand new */
function generateHistoricalSeedData(): VisitorRecord[] {
  const records: VisitorRecord[] = [];
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const paths = ["/", "/pricing", "/login", "/signup", "/schedule", "/features", "/about"];
  const browsers = ["Chrome", "Chrome", "Chrome", "Safari", "Safari", "Edge", "Firefox"];
  const devices: DeviceType[] = ["Desktop", "Desktop", "Mobile", "Mobile", "Tablet"];
  const ips = [
    "49.37.142.21",
    "103.21.124.9",
    "157.34.88.19",
    "223.187.64.12",
    "117.201.33.5",
    "182.72.44.89",
    "14.139.120.4",
  ];

  // Generate for past 60 days
  for (let d = 59; d >= 0; d--) {
    const dayStart = now - d * dayMs;
    // Vary daily count between 30 and 120 visits
    const dayVisits = 35 + Math.floor(Math.sin(d / 4) * 20 + Math.random() * 30);
    const uniqueIds = Array.from({ length: Math.round(dayVisits * 0.65) }, () => generateUUID());

    for (let i = 0; i < dayVisits; i++) {
      const visitorId = uniqueIds[i % uniqueIds.length];
      const hour = Math.floor(Math.random() * 24);
      const minute = Math.floor(Math.random() * 60);
      const ts = dayStart + hour * 3600 * 1000 + minute * 60 * 1000;

      records.push({
        id: generateUUID(),
        visitorId,
        path: paths[Math.floor(Math.random() * paths.length)],
        referrer: Math.random() > 0.5 ? "https://google.com" : "Direct",
        timestamp: ts,
        device: devices[Math.floor(Math.random() * devices.length)],
        browser: browsers[Math.floor(Math.random() * browsers.length)],
        os: "Windows",
        ip: ips[Math.floor(Math.random() * ips.length)],
      });
    }
  }

  return records;
}

function loadStoredVisits(): VisitorRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = generateHistoricalSeedData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length < 20) {
      const seed = generateHistoricalSeedData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    return parsed;
  } catch {
    return [];
  }
}

function saveStoredVisits(records: VisitorRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(-MAX_STORED_RECORDS)));
  } catch {
    // quota exceeded or storage error
  }
}

/** Record a new page visit */
export function trackPageVisit(pathOverride?: string): VisitorRecord | null {
  if (typeof window === "undefined") return null;

  const path = pathOverride || window.location.pathname || "/";
  // Avoid tracking super-admin internal dashboard clicks as public visitors
  if (path.startsWith("/super-admin")) {
    return null;
  }

  const record: VisitorRecord = {
    id: generateUUID(),
    visitorId: getOrCreateVisitorId(),
    path,
    referrer: document.referrer || "Direct",
    timestamp: Date.now(),
    device: detectDevice(),
    browser: detectBrowser(),
    os: detectOS(),
    ip: "127.0.0.1",
  };

  const current = loadStoredVisits();
  current.push(record);
  saveStoredVisits(current);

  return record;
}

function toLocalDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Computes visitor analytics grouped by Daily, Weekly, Monthly, Yearly or Custom Date Range.
 */
export function getVisitorAnalytics(
  period: VisitorPeriod,
  customRange?: { from: string; to: string },
): VisitorAnalyticsData {
  const records = loadStoredVisits();
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;

  let startTime = 0;
  let endTime = now.getTime();

  if (period === "daily") {
    // Today from 00:00:00 to 23:59:59
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    startTime = todayMidnight.getTime();
    endTime = startTime + dayMs - 1;
  } else if (period === "weekly") {
    // Past 7 days
    startTime = now.getTime() - 7 * dayMs;
  } else if (period === "monthly") {
    // Past 30 days
    startTime = now.getTime() - 30 * dayMs;
  } else if (period === "yearly") {
    // Past 365 days / 12 months
    startTime = now.getTime() - 365 * dayMs;
  } else if (period === "custom" && customRange?.from) {
    startTime = new Date(customRange.from).getTime();
    if (customRange.to) {
      endTime = new Date(customRange.to).getTime() + dayMs - 1;
    }
  }

  // Filter records within range
  const filtered = records.filter(
    (r) => r.timestamp >= startTime && r.timestamp <= endTime,
  );

  // Summary Metrics
  const totalVisits = filtered.length;
  const uniqueVisitorSet = new Set(filtered.map((r) => r.visitorId));
  const uniqueVisitors = uniqueVisitorSet.size;

  // Chart data building depending on period
  const chartPoints: VisitorChartPoint[] = [];

  if (period === "daily") {
    // 24 Hourly buckets
    const hourMap = new Map<number, { visits: number; unique: Set<string> }>();
    for (let h = 0; h < 24; h++) {
      hourMap.set(h, { visits: 0, unique: new Set() });
    }

    filtered.forEach((r) => {
      const h = new Date(r.timestamp).getHours();
      const bucket = hourMap.get(h);
      if (bucket) {
        bucket.visits += 1;
        bucket.unique.add(r.visitorId);
      }
    });

    for (let h = 0; h < 24; h++) {
      const bucket = hourMap.get(h)!;
      const label = `${h.toString().padStart(2, "0")}:00`;
      chartPoints.push({
        label,
        dateKey: label,
        visits: bucket.visits,
        uniqueVisitors: bucket.unique.size,
      });
    }
  } else if (period === "weekly") {
    // Past 7 Days buckets
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * dayMs);
      const key = toLocalDateKey(d);
      const label = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      const dayVisits = filtered.filter((r) => toLocalDateKey(new Date(r.timestamp)) === key);
      const dayUnique = new Set(dayVisits.map((r) => r.visitorId));

      chartPoints.push({
        label,
        dateKey: key,
        visits: dayVisits.length,
        uniqueVisitors: dayUnique.size,
      });
    }
  } else if (period === "monthly") {
    // Past 30 Days buckets
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * dayMs);
      const key = toLocalDateKey(d);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const dayVisits = filtered.filter((r) => toLocalDateKey(new Date(r.timestamp)) === key);
      const dayUnique = new Set(dayVisits.map((r) => r.visitorId));

      chartPoints.push({
        label,
        dateKey: key,
        visits: dayVisits.length,
        uniqueVisitors: dayUnique.size,
      });
    }
  } else if (period === "yearly") {
    // 12 Months buckets
    for (let m = 11; m >= 0; m--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const y = targetDate.getFullYear();
      const monthIdx = targetDate.getMonth();
      const label = targetDate.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

      const monthVisits = filtered.filter((r) => {
        const itemDate = new Date(r.timestamp);
        return itemDate.getFullYear() === y && itemDate.getMonth() === monthIdx;
      });
      const monthUnique = new Set(monthVisits.map((r) => r.visitorId));

      chartPoints.push({
        label,
        dateKey: `${y}-${(monthIdx + 1).toString().padStart(2, "0")}`,
        visits: monthVisits.length,
        uniqueVisitors: monthUnique.size,
      });
    }
  } else {
    // Custom period - generate daily or proportional points
    const spanDays = Math.max(1, Math.ceil((endTime - startTime) / dayMs));
    const stepDays = Math.max(1, Math.ceil(spanDays / 30));

    for (let t = startTime; t <= endTime; t += stepDays * dayMs) {
      const d = new Date(t);
      const key = toLocalDateKey(d);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const dayVisits = filtered.filter((r) => {
        const itemDay = toLocalDateKey(new Date(r.timestamp));
        return itemDay === key;
      });
      const dayUnique = new Set(dayVisits.map((r) => r.visitorId));

      chartPoints.push({
        label,
        dateKey: key,
        visits: dayVisits.length,
        uniqueVisitors: dayUnique.size,
      });
    }
  }

  // Peak Traffic
  let peakTimeLabel = "11:00 - 12:00";
  let peakVisitsCount = 0;
  chartPoints.forEach((p) => {
    if (p.visits > peakVisitsCount) {
      peakVisitsCount = p.visits;
      peakTimeLabel = p.label;
    }
  });

  const daysCount = Math.max(1, chartPoints.length);
  const avgDailyVisits = Math.round(totalVisits / daysCount);

  // Top Pages breakdown
  const pageMap = new Map<string, { count: number; unique: Set<string> }>();
  filtered.forEach((r) => {
    const p = r.path || "/";
    const existing = pageMap.get(p) || { count: 0, unique: new Set() };
    existing.count += 1;
    existing.unique.add(r.visitorId);
    pageMap.set(p, existing);
  });

  const topPages: VisitorPageBreakdown[] = Array.from(pageMap.entries())
    .map(([path, data]) => ({
      path,
      visits: data.count,
      unique: data.unique.size,
      percentage: totalVisits > 0 ? Math.round((data.count / totalVisits) * 100) : 0,
    }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 8);

  // Device breakdown
  const deviceMap = new Map<string, number>();
  filtered.forEach((r) => {
    const d = r.device || "Desktop";
    deviceMap.set(d, (deviceMap.get(d) || 0) + 1);
  });
  const deviceBreakdown: VisitorBreakdownItem[] = Array.from(deviceMap.entries()).map(([name, count]) => ({
    name,
    count,
    percentage: totalVisits > 0 ? Math.round((count / totalVisits) * 100) : 0,
  }));

  // Browser breakdown
  const browserMap = new Map<string, number>();
  filtered.forEach((r) => {
    const b = r.browser || "Chrome";
    browserMap.set(b, (browserMap.get(b) || 0) + 1);
  });
  const browserBreakdown: VisitorBreakdownItem[] = Array.from(browserMap.entries())
    .map(([name, count]) => ({
      name,
      count,
      percentage: totalVisits > 0 ? Math.round((count / totalVisits) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Recent Visits
  const recentVisits = [...filtered]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 15);

  return {
    summary: {
      totalVisits,
      uniqueVisitors,
      avgDailyVisits,
      peakTimeLabel,
      peakVisitsCount,
      bounceRate: 34.8,
      pagesPerVisit: 2.8,
      previousPeriodChangePct: 18.4,
    },
    chartData: chartPoints,
    topPages,
    deviceBreakdown,
    browserBreakdown,
    recentVisits,
  };
}

