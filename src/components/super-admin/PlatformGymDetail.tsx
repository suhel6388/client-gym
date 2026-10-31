"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Ban,
  Building2,
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  CreditCard,
  History,
  Mail,
  MapPin,
  Phone,
  Play,
  RefreshCw,
  ShieldAlert,
  TriangleAlert,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import {
  SUPER_ADMIN_PATH,
  fetchPlatformGym,
  listPlatformPlans,
  type PlatformGymDetail,
  type SubscriptionPlan,
} from "@/lib/api";
import { formatNumber } from "@/lib/format";
import {
  entitlementLabel,
  formatPaise,
  formatPlatformDate,
  formatPlatformDateTime,
  platformInitials,
  platformStatusMeta,
} from "@/lib/super-admin-view";
import { GymActionDialog, type GymActionMode } from "./GymActionDialog";
import { PlatformAuditList } from "./PlatformAuditList";

const GYMS_PATH = `${SUPER_ADMIN_PATH}/gyms`;

function paymentTone(status: string): BadgeTone {
  switch (status) {
    case "SUCCESS":
      return "success";
    case "FAILED":
    case "DISPUTED":
      return "danger";
    case "REFUNDED":
      return "warning";
    case "PENDING":
    case "CREATED":
      return "neutral";
    default:
      return "muted";
  }
}

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <dt className="text-[11.5px] text-faint">{label}</dt>
      <dd
        className={cn(
          "min-w-0 text-right text-[12px] text-ink",
          mono && "font-mono text-[11px]",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function StatPill({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Users;
}) {
  return (
    <div className="rounded-xl border border-line/70 bg-card/50 px-3.5 py-3">
      <div className="flex items-center gap-1.5 text-faint">
        <Icon className="size-3.5" strokeWidth={1.75} aria-hidden />
        <span className="text-[10.5px] uppercase tracking-[0.08em]">{label}</span>
      </div>
      <p className="mt-1 text-[18px] font-semibold leading-none tabular-nums text-ink">
        {formatNumber(value)}
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="mt-6 space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-20 animate-pulse rounded-xl border border-line/60 bg-card-hover/30" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="h-72 animate-pulse rounded-2xl border border-line/60 bg-card-hover/30 xl:col-span-2" />
        <div className="h-72 animate-pulse rounded-2xl border border-line/60 bg-card-hover/30" />
      </div>
      <div className="h-64 animate-pulse rounded-2xl border border-line/60 bg-card-hover/30" />
    </div>
  );
}

export function PlatformGymDetailView({ gymId }: { gymId: string }) {
  const [detail, setDetail] = useState<PlatformGymDetail | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [action, setAction] = useState<GymActionMode | null>(null);

  const reload = useCallback(() => setReloadKey((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([
      fetchPlatformGym(gymId, controller.signal),
      listPlatformPlans(controller.signal),
    ])
      .then(([gymDetail, planList]) => {
        if (!active) return;
        setDetail(gymDetail);
        setPlans(planList);
      })
      .catch((err: unknown) => {
        if (!active || controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Couldn't load this gym.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [gymId, reloadKey]);

  if (loading && !detail) {
    return (
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <BackLink />
        <LoadingSkeleton />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <BackLink />
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-line bg-card/40 px-6 py-14 text-center">
          <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-danger/10 text-danger ring-1 ring-inset ring-danger/20">
            <ShieldAlert className="size-5" strokeWidth={1.75} aria-hidden />
          </span>
          <p className="mt-4 text-sm font-semibold text-ink">
            Couldn&apos;t load this gym
          </p>
          <p className="mt-1 max-w-md text-sm text-subtle">
            {error ?? "The gym may no longer exist, or the link is incomplete."}
          </p>
          <div className="mt-4 flex items-center gap-2">
            <Button variant="secondary" size="md" onClick={reload}>
              <RefreshCw className="size-4" strokeWidth={2} aria-hidden />
              Try again
            </Button>
            <Link
              href={GYMS_PATH}
              className="inline-flex h-9.5 items-center rounded-lg border border-line bg-card px-4 text-sm font-medium text-subtle transition-colors hover:text-ink"
            >
              All gyms
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { gym, subscription, effectiveStatus } = detail;
  const meta = platformStatusMeta(effectiveStatus);
  const trialing = effectiveStatus === "TRIALING";
  const suspended = effectiveStatus === "SUSPENDED";
  const paidTotal = detail.payments
    .filter((payment) => payment.status === "SUCCESS")
    .reduce((sum, payment) => sum + payment.amountPaise, 0);

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <BackLink />

      {/* Header */}
      <div className="animate-fade-up mt-4 rounded-2xl border border-line bg-gradient-to-b from-card/90 to-card/50 p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 items-start gap-3.5">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-gold/12 text-gold ring-1 ring-inset ring-gold/20">
              <Building2 className="size-5" strokeWidth={1.75} aria-hidden />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-[24px] font-bold leading-tight tracking-tight text-ink">
                  {gym.name}
                </h1>
                <Badge tone={meta.tone} dot>
                  {meta.label}
                </Badge>
                <Badge tone={subscription?.entitled ? "success" : "danger"}>
                  {subscription?.entitled ? "Access enabled" : "Access blocked"}
                </Badge>
              </div>
              <p className="mt-1 truncate font-mono text-[11px] text-faint">{gym.id}</p>
              <p className="mt-1.5 text-[12px] text-subtle">
                Registered {formatPlatformDate(gym.registeredAt)}
                {gym.email ? ` · ${gym.email}` : ""}
                {gym.phone ? ` · ${gym.phone}` : ""}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" size="sm" onClick={() => setAction("plan")}>
              <CreditCard className="size-3.5" strokeWidth={2} aria-hidden />
              {subscription ? "Change plan" : "Assign plan"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setAction("extend")}
              disabled={!subscription}
              title={!subscription ? "Assign a plan first" : undefined}
            >
              <CalendarPlus className="size-3.5" strokeWidth={1.75} aria-hidden />
              Extend expiry
            </Button>
            {trialing ? (
              <>
                <Button variant="secondary" size="sm" onClick={() => setAction("trial")}>
                  <CalendarClock className="size-3.5" strokeWidth={1.75} aria-hidden />
                  Extend trial
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setAction("end-trial")}>
                  <Ban className="size-3.5" strokeWidth={1.75} aria-hidden />
                  End trial
                </Button>
              </>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => setAction("trial")}>
                <CalendarClock className="size-3.5" strokeWidth={1.75} aria-hidden />
                Start trial
              </Button>
            )}
            {subscription &&
              (suspended ? (
                <Button variant="primary" size="sm" onClick={() => setAction("activate")}>
                  <Play className="size-3.5" strokeWidth={2} aria-hidden />
                  Activate
                </Button>
              ) : (
                <Button variant="secondary" size="sm" onClick={() => setAction("suspend")}>
                  <Ban className="size-3.5" strokeWidth={1.75} aria-hidden />
                  Suspend
                </Button>
              ))}
            <Button variant="ghost" size="sm" onClick={reload} disabled={loading}>
              <RefreshCw
                className={cn("size-3.5", loading && "animate-spin")}
                strokeWidth={1.75}
                aria-hidden
              />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Tenant stats */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <StatPill label="Members" value={detail.stats.members} icon={Users} />
        <StatPill
          label="Active memberships"
          value={detail.stats.activeMemberships}
          icon={BadgeCheck}
        />
        <StatPill label="Staff accounts" value={detail.stats.staff} icon={UserRound} />
        <StatPill label="Membership plans" value={detail.stats.membershipPlans} icon={CreditCard} />
        <StatPill label="Attendance rows" value={detail.stats.attendanceRecords} icon={CalendarClock} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Subscription */}
        <section className="rounded-2xl border border-line bg-card/60 xl:col-span-2">
          <div className="flex items-center justify-between gap-3 border-b border-line/60 px-5 py-4">
            <div>
              <h2 className="text-[14px] font-semibold text-ink">Subscription</h2>
              <p className="mt-0.5 text-[11.5px] text-faint">
                Platform billing — separate from the gym&apos;s own membership plans.
              </p>
            </div>
            <Badge tone={meta.tone} dot>
              {meta.label}
            </Badge>
          </div>

          {subscription ? (
            <div className="grid grid-cols-1 gap-x-8 px-5 py-4 md:grid-cols-2">
              <dl className="divide-y divide-line/40">
                <InfoRow
                  label="Plan"
                  value={
                    subscription.plan?.name ??
                    subscription.planNameSnapshot ??
                    (trialing ? "Free trial" : "—")
                  }
                />
                <InfoRow
                  label="Price"
                  value={
                    subscription.pricePaise > 0
                      ? formatPaise(subscription.pricePaise)
                      : "Free"
                  }
                />
                <InfoRow
                  label="Period start"
                  value={formatPlatformDate(subscription.currentPeriodStart)}
                />
                <InfoRow
                  label="Expiry"
                  value={formatPlatformDate(subscription.expiresAt)}
                />
                <InfoRow
                  label="Days remaining"
                  value={
                    subscription.expiresAt
                      ? `${subscription.remainingDays} day${
                          subscription.remainingDays === 1 ? "" : "s"
                        }`
                      : "—"
                  }
                />
                <InfoRow
                  label="Cancel at period end"
                  value={subscription.cancelAtPeriodEnd ? "Yes" : "No"}
                />
              </dl>
              <dl className="divide-y divide-line/40">
                <InfoRow
                  label="Trial starts"
                  value={formatPlatformDate(subscription.trialStartsAt)}
                />
                <InfoRow
                  label="Trial ends"
                  value={formatPlatformDate(subscription.trialEndsAt)}
                />
                <InfoRow
                  label="Payment provider"
                  value={subscription.paymentProvider ?? "—"}
                />
                <InfoRow
                  label="Status updated"
                  value={formatPlatformDateTime(subscription.updatedAt)}
                />
                <InfoRow
                  label="Subscription ID"
                  value={subscription.id}
                  mono
                />
              </dl>

              <div className="mt-3 md:col-span-2">
                <div
                  className={cn(
                    "flex items-start gap-2 rounded-xl border px-3.5 py-3",
                    subscription.entitled
                      ? "border-success/25 bg-success/8"
                      : "border-danger/25 bg-danger/8",
                  )}
                >
                  {subscription.entitled ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" strokeWidth={1.75} aria-hidden />
                  ) : (
                    <TriangleAlert className="mt-0.5 size-4 shrink-0 text-danger" strokeWidth={1.75} aria-hidden />
                  )}
                  <div>
                    <p className="text-[12px] font-medium text-ink">
                      {subscription.entitled ? "Entitled to gym access" : "Gym access is blocked"}
                    </p>
                    <p className="mt-0.5 text-[11.5px] text-subtle">
                      Server reason: {entitlementLabel(subscription.entitlementReason)}
                      {suspended
                        ? " — lifted manually by activating the gym."
                        : ""}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-3 px-5 py-8 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-ink">No subscription on record</p>
                <p className="mt-1 max-w-lg text-[12px] leading-relaxed text-subtle">
                  This gym has never been granted a trial or paid plan. Assign a plan to
                  start billing, or start a trial without creating a payment row.
                </p>
              </div>
              <Button variant="primary" size="md" onClick={() => setAction("plan")}>
                <CreditCard className="size-4" strokeWidth={2} aria-hidden />
                Assign plan
              </Button>
            </div>
          )}
        </section>

        {/* Owner + gym contact */}
        <section className="rounded-2xl border border-line bg-card/60">
          <div className="border-b border-line/60 px-5 py-4">
            <h2 className="text-[14px] font-semibold text-ink">Owner & contact</h2>
            <p className="mt-0.5 text-[11.5px] text-faint">
              Account and contact details for this tenant.
            </p>
          </div>
          <div className="px-5 py-4">
            {detail.owner ? (
              <div className="flex items-start gap-3">
                <Avatar
                  initials={platformInitials(detail.owner.name)}
                  index={detail.owner.name.charCodeAt(0) % 4}
                  className="size-10"
                />
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-medium text-ink">
                    {detail.owner.name}
                  </p>
                  <p className="truncate text-[11.5px] text-faint">{detail.owner.email}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <Badge tone="gold">Gym owner</Badge>
                    <Badge tone={detail.owner.emailVerified ? "success" : "warning"}>
                      {detail.owner.emailVerified ? "Email verified" : "Email unverified"}
                    </Badge>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[12px] text-subtle">
                No owner account is attached to this gym.
              </p>
            )}

            <dl className="mt-4 space-y-2 border-t border-line/50 pt-3">
              {detail.owner?.email && (
                <div className="flex items-center gap-2 text-[12px]">
                  <Mail className="size-3.5 shrink-0 text-faint" strokeWidth={1.75} aria-hidden />
                  <a
                    href={`mailto:${detail.owner.email}`}
                    className="truncate text-subtle hover:text-gold"
                  >
                    {detail.owner.email}
                  </a>
                </div>
              )}
              {(detail.owner?.phone || gym.phone) && (
                <div className="flex items-center gap-2 text-[12px]">
                  <Phone className="size-3.5 shrink-0 text-faint" strokeWidth={1.75} aria-hidden />
                  <span className="truncate text-subtle">
                    {detail.owner?.phone ?? gym.phone}
                  </span>
                </div>
              )}
              {gym.address && (
                <div className="flex items-start gap-2 text-[12px]">
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-faint" strokeWidth={1.75} aria-hidden />
                  <span className="text-subtle">{gym.address}</span>
                </div>
              )}
              {detail.owner?.createdAt && (
                <div className="flex items-center gap-2 text-[12px]">
                  <CalendarClock className="size-3.5 shrink-0 text-faint" strokeWidth={1.75} aria-hidden />
                  <span className="text-subtle">
                    Owner since {formatPlatformDate(detail.owner.createdAt)}
                  </span>
                </div>
              )}
            </dl>

            {detail.owners.length > 1 && (
              <div className="mt-4 border-t border-line/50 pt-3">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-faint">
                  Other owner accounts
                </p>
                <ul className="mt-2 space-y-1.5">
                  {detail.owners.slice(1).map((owner) => (
                    <li key={owner.id} className="truncate text-[11.5px] text-subtle">
                      {owner.name} · {owner.email}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between border-t border-line/50 pt-3 text-[11.5px]">
              <span className="inline-flex items-center gap-1.5 text-faint">
                <Users className="size-3.5" strokeWidth={1.75} aria-hidden />
                {detail.stats.totalUsers} total account
                {detail.stats.totalUsers === 1 ? "" : "s"}
              </span>
              <span className="text-faint">{detail.stats.staff} staff</span>
            </div>
          </div>
        </section>
      </div>

      {/* Payments */}
      <section className="mt-4 rounded-2xl border border-line bg-card/60">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 px-5 py-4">
          <div>
            <h2 className="text-[14px] font-semibold text-ink">Subscription payments</h2>
            <p className="mt-0.5 text-[11.5px] text-faint">
              Real provider payments only. Manual plan grants never create a row here.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="gold">{formatPaise(paidTotal)} collected</Badge>
            <Badge tone="neutral">
              {detail.payments.length} record{detail.payments.length === 1 ? "" : "s"}
            </Badge>
          </div>
        </div>

        {detail.payments.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-10 text-center">
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-card-hover text-faint">
              <Wallet className="size-4.5" strokeWidth={1.75} aria-hidden />
            </span>
            <p className="mt-3 text-sm font-medium text-ink">No payments recorded</p>
            <p className="mt-1 max-w-md text-[12px] text-subtle">
              Revenue only appears when Razorpay confirms a payment. Assigning a plan or
              extending access is an audited platform action, not a payment.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[760px] divide-y divide-line/50">
              <thead>
                <tr className="bg-card-hover/30">
                  {["Amount", "Status", "Provider", "Reference", "Created", "Verified"].map(
                    (label) => (
                      <th
                        key={label}
                        className="whitespace-nowrap px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-faint"
                      >
                        {label}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40">
                {detail.payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-card-hover/30">
                    <td className="whitespace-nowrap px-5 py-3 text-[12.5px] font-semibold tabular-nums text-ink">
                      {formatPaise(payment.amountPaise)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={paymentTone(payment.status)} dot>
                        {payment.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-[12px] text-subtle">{payment.provider}</td>
                    <td className="px-5 py-3">
                      <p className="font-mono text-[10.5px] text-subtle">
                        {payment.paymentId ?? "—"}
                      </p>
                      <p className="font-mono text-[10px] text-faint">
                        {payment.orderId ?? ""}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-[11.5px] text-subtle">
                      {formatPlatformDate(payment.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-[11.5px] text-subtle">
                      {formatPlatformDate(payment.verifiedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="divide-y divide-line/40 lg:hidden">
            {detail.payments.map((payment) => (
              <li key={payment.id} className="px-4 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold tabular-nums text-ink">
                      {formatPaise(payment.amountPaise)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-faint">
                      {formatPlatformDate(payment.createdAt)}
                    </p>
                  </div>
                  <Badge tone={paymentTone(payment.status)} dot>
                    {payment.status}
                  </Badge>
                </div>
                <dl className="mt-2 space-y-1 border-t border-line/40 pt-2 text-[11.5px]">
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-faint">Provider</dt>
                    <dd className="text-subtle">{payment.provider}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <dt className="shrink-0 text-faint">Reference</dt>
                    <dd className="min-w-0 truncate text-right font-mono text-[10.5px] text-subtle">
                      {payment.paymentId ?? payment.orderId ?? "—"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-faint">Verified</dt>
                    <dd className="text-subtle">{formatPlatformDate(payment.verifiedAt)}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
          </>
        )}
      </section>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Trial history */}
        <section className="rounded-2xl border border-line bg-card/60">
          <div className="flex items-center justify-between gap-3 border-b border-line/60 px-5 py-4">
            <div>
              <h2 className="text-[14px] font-semibold text-ink">Trial history</h2>
              <p className="mt-0.5 text-[11.5px] text-faint">
                Every initial and extended trial grant.
              </p>
            </div>
            <Badge tone="gold">{detail.trialHistory.length}</Badge>
          </div>
          {detail.trialHistory.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-subtle">
              No trial records for this gym.
            </p>
          ) : (
            <ul className="divide-y divide-line/40">
              {detail.trialHistory.map((trial) => (
                <li key={trial.id} className="px-5 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={trial.type === "EXTENSION" ? "warning" : "gold"}>
                      {trial.type === "EXTENSION" ? "Extension" : "Initial trial"}
                    </Badge>
                    <span className="text-[11px] text-faint">
                      {formatPlatformDate(trial.startsAt)} →{" "}
                      {formatPlatformDate(trial.endsAt)}
                    </span>
                    <span className="ml-auto text-[10.5px] text-faint">
                      {formatPlatformDate(trial.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-[11.5px] text-subtle">
                    {trial.reason || "No reason recorded"}
                  </p>
                  <p className="mt-0.5 text-[10.5px] text-faint">
                    {trial.grantedByRole ?? "SYSTEM"}
                    {trial.source ? ` · ${trial.source}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Audit log */}
        <section className="rounded-2xl border border-line bg-card/60">
          <div className="flex items-center justify-between gap-3 border-b border-line/60 px-5 py-4">
            <div>
              <h2 className="text-[14px] font-semibold text-ink">
                Subscription history & audit
              </h2>
              <p className="mt-0.5 text-[11.5px] text-faint">
                Who changed what, when and why.
              </p>
            </div>
            <Link
              href={`${SUPER_ADMIN_PATH}/activity`}
              className="inline-flex items-center gap-1 text-[12px] font-medium text-gold hover:text-gold-bright"
            >
              <History className="size-3.5" strokeWidth={1.75} aria-hidden />
              Activity
            </Link>
          </div>
          <PlatformAuditList
            logs={detail.auditLogs}
            emptyLabel="No plan, trial or access changes recorded yet."
            className="max-h-[520px] overflow-y-auto scroll-thin"
          />
        </section>
      </div>

      {action && (
        <GymActionDialog
          key={action}
          mode={action}
          gym={gym}
          subscription={subscription}
          effectiveStatus={effectiveStatus}
          plans={plans}
          onClose={() => setAction(null)}
          onSaved={reload}
        />
      )}
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href={GYMS_PATH}
      className="inline-flex items-center gap-1.5 text-[12px] font-medium text-faint transition-colors hover:text-gold"
    >
      <ArrowLeft className="size-3.5" strokeWidth={2} aria-hidden />
      All gyms
    </Link>
  );
}
