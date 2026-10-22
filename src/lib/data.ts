/* ---------------------------------------------------------------------------
   Shell fixtures for chrome that does not yet have an API (notifications).
   Dashboard data is loaded from the backend in `dashboard-view.ts`.
   --------------------------------------------------------------------------- */

export const notifications = [
  {
    id: "n1",
    title: "Payment received",
    body: "Marcus Bennett paid ₹1,299.00 for Annual Pro.",
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
