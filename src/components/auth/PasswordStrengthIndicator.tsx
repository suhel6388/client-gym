"use client";

import { cn } from "@/lib/cn";

export type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: "Too weak" | "Weak" | "Fair" | "Good" | "Strong";
};

const STRENGTH_ORDER: PasswordStrength["label"][] = [
  "Too weak",
  "Weak",
  "Fair",
  "Good",
  "Strong",
];

const BAR_TONES = [
  "bg-danger",
  "bg-danger",
  "bg-warning",
  "bg-auth-gold",
  "bg-success",
] as const;

/** Heuristic password score: length plus character variety. */
export function scorePassword(password: string): PasswordStrength {
  if (!password) return { score: 0, label: "Too weak" };

  let points = 0;
  if (password.length >= 8) points += 1;
  if (password.length >= 12) points += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) points += 1;
  if (/\d/.test(password)) points += 1;
  if (/[^A-Za-z0-9]/.test(password)) points += 1;
  if (password.length < 8) points = Math.min(points, 1);

  const score = Math.max(1, Math.min(4, points)) as PasswordStrength["score"];
  return { score, label: STRENGTH_ORDER[score] };
}

type PasswordStrengthIndicatorProps = {
  password: string;
  className?: string;
};

/** Four-segment gold strength meter shown under password fields. */
export function PasswordStrengthIndicator({ password, className }: PasswordStrengthIndicatorProps) {
  const { score, label } = scorePassword(password);
  const tone = password ? BAR_TONES[score] : "bg-auth-line";

  return (
    <div className={cn("space-y-1.5", className)} aria-live="polite">
      <div className="flex gap-1.5" aria-hidden>
        {[1, 2, 3, 4].map((segment) => (
          <span
            key={segment}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-300",
              password && segment <= score ? tone : "bg-auth-line",
            )}
          />
        ))}
      </div>
      {password && (
        <p className="text-[11px] text-auth-muted">
          Password strength:{" "}
          <span
            className={cn(
              "font-medium",
              score <= 1 ? "text-danger" : score === 2 ? "text-warning" : "text-success",
            )}
          >
            {label}
          </span>
          <span className="text-auth-faint"> · 8+ characters with a mix of letters & numbers</span>
        </p>
      )}
    </div>
  );
}
