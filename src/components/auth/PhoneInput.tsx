"use client";

import { useState, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Country = { code: string; dial: string; label: string };

/** Common dial codes; the list is intentionally short and searchable-free. */
const COUNTRIES: Country[] = [
  { code: "IN", dial: "+91", label: "India +91" },
  { code: "US", dial: "+1", label: "United States +1" },
  { code: "GB", dial: "+44", label: "United Kingdom +44" },
  { code: "AE", dial: "+971", label: "UAE +971" },
  { code: "CA", dial: "+1", label: "Canada +1" },
  { code: "AU", dial: "+61", label: "Australia +61" },
  { code: "SG", dial: "+65", label: "Singapore +65" },
  { code: "DE", dial: "+49", label: "Germany +49" },
  { code: "SA", dial: "+966", label: "Saudi Arabia +966" },
  { code: "ZA", dial: "+27", label: "South Africa +27" },
];

type PhoneInputProps = {
  label: string;
  id: string;
  onValueChange: (value: string) => void;
  error?: string;
  required?: boolean;
  /** Full E.164-ish value ("+911234567890") is reported through onValueChange. */
};

/**
 * Phone number with a country-code select. `onValueChange` emits the complete
 * number in international form, matching the backend's `^\+?\d{10,15}$` rule.
 */
export function PhoneInput({ label, id, onValueChange, error, required }: PhoneInputProps) {
  const [dial, setDial] = useState(COUNTRIES[0].dial);
  const [digits, setDigits] = useState("");

  const emit = (nextDial: string, nextDigits: string) => {
    const compact = nextDigits.replace(/\D/g, "");
    onValueChange(compact ? `${nextDial}${compact}` : "");
  };

  const selectProps: SelectHTMLAttributes<HTMLSelectElement> = {
    value: dial,
    onChange: (event) => {
      setDial(event.target.value);
      emit(event.target.value, digits);
    },
  };

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-auth-muted">
        {label}
        {required && <span className="ml-0.5 text-auth-gold" aria-hidden>*</span>}
      </label>
      <div
        className={cn(
          "flex h-10 w-full overflow-hidden rounded-lg border border-auth-line bg-auth-input transition-colors focus-within:border-auth-gold/60 focus-within:ring-2 focus-within:ring-auth-gold/15",
          error && "border-danger/60",
        )}
      >
        <select
          aria-label="Country code"
          {...selectProps}
          className="h-full w-[7.75rem] shrink-0 border-r border-auth-line bg-transparent px-2.5 text-[13px] text-auth-muted outline-none"
        >
          {COUNTRIES.map((country) => (
            <option key={`${country.code}-${country.dial}`} value={country.dial} className="bg-auth-card text-auth-ink">
              {country.label}
            </option>
          ))}
        </select>
        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="98765 43210"
          required={required}
          value={digits}
          onChange={(event) => {
            const next = event.target.value.replace(/[^\d\s-]/g, "");
            setDigits(next);
            emit(dial, next);
          }}
          className="h-full w-full min-w-0 bg-transparent px-3 text-[13.5px] text-auth-ink outline-none placeholder:text-auth-faint"
        />
      </div>
      {error && (
        <p role="alert" className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
