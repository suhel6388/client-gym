"use client";

import { useState } from "react";
import { X, Save, AlertCircle } from "lucide-react";
import { type BillingPlan } from "@/lib/api/billing";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

type PlanFormProps = {
  initialData?: BillingPlan | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<BillingPlan>) => Promise<void>;
};

export function PlanForm({ initialData, isOpen, onClose, onSubmit }: PlanFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [code, setCode] = useState(initialData?.code || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [priceRupees, setPriceRupees] = useState(
    initialData ? String(Math.round(initialData.pricePaise / 100)) : "499",
  );
  const [durationMonths, setDurationMonths] = useState(
    initialData?.durationMonths ? String(initialData.durationMonths) : "1",
  );
  const [durationDays, setDurationDays] = useState(
    initialData?.durationDays ? String(initialData.durationDays) : "30",
  );
  const [gstPercent, setGstPercent] = useState(
    initialData?.gstPercent !== undefined ? String(initialData.gstPercent) : "18",
  );
  const [featuresText, setFeaturesText] = useState(
    initialData?.features?.join("\n") || "Unlimited members\nAttendance tracking\nPayment receipts",
  );
  const [maxStaff, setMaxStaff] = useState(
    initialData?.maxStaff ? String(initialData.maxStaff) : "5",
  );
  const [maxBranches, setMaxBranches] = useState(
    initialData?.maxBranches ? String(initialData.maxBranches) : "1",
  );
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      const pricePaise = Math.round(Number(priceRupees) * 100);
      if (Number.isNaN(pricePaise) || pricePaise < 0) {
        throw new Error("Please enter a valid price in rupees");
      }

      const features = featuresText
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean);

      await onSubmit({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        slug: slug.trim().toLowerCase() || null,
        description: description.trim() || null,
        pricePaise,
        currency: "INR",
        durationMonths: Number(durationMonths) || 1,
        durationDays: Number(durationDays) || 30,
        gstPercent: Number(gstPercent) || 0,
        features,
        maxStaff: maxStaff ? Number(maxStaff) : null,
        maxBranches: maxBranches ? Number(maxBranches) : null,
        isActive,
      });

      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save plan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <h2 className="text-lg font-bold text-white">
            {initialData ? `Edit ${initialData.name}` : "Create New SaaS Plan"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs text-zinc-400">Plan Name *</Label>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Pro Monthly"
                className="mt-1 bg-zinc-950 border-zinc-800 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-zinc-400">Code *</Label>
              <Input
                required
                disabled={Boolean(initialData)}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. PRO_MONTHLY"
                className="mt-1 bg-zinc-950 border-zinc-800 text-sm font-mono"
              />
            </div>
            <div>
              <Label className="text-xs text-zinc-400">Slug (optional)</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. pro"
                className="mt-1 bg-zinc-950 border-zinc-800 text-sm font-mono"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-zinc-400">Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short tagline shown to gym owners"
              className="mt-1 bg-zinc-950 border-zinc-800 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs text-zinc-400">Price (₹ INR) *</Label>
              <Input
                type="number"
                required
                min="0"
                value={priceRupees}
                onChange={(e) => setPriceRupees(e.target.value)}
                placeholder="499"
                className="mt-1 bg-zinc-950 border-zinc-800 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-zinc-400">Duration (Days)</Label>
              <Input
                type="number"
                min="1"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                className="mt-1 bg-zinc-950 border-zinc-800 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-zinc-400">Duration (Months)</Label>
              <Input
                type="number"
                min="1"
                value={durationMonths}
                onChange={(e) => setDurationMonths(e.target.value)}
                className="mt-1 bg-zinc-950 border-zinc-800 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-zinc-400">GST %</Label>
              <Input
                type="number"
                min="0"
                max="50"
                value={gstPercent}
                onChange={(e) => setGstPercent(e.target.value)}
                className="mt-1 bg-zinc-950 border-zinc-800 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-zinc-400">Max Staff Allowed</Label>
              <Input
                type="number"
                value={maxStaff}
                onChange={(e) => setMaxStaff(e.target.value)}
                placeholder="Unlimited if empty"
                className="mt-1 bg-zinc-950 border-zinc-800 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-zinc-400">Max Gym Branches</Label>
              <Input
                type="number"
                value={maxBranches}
                onChange={(e) => setMaxBranches(e.target.value)}
                placeholder="1"
                className="mt-1 bg-zinc-950 border-zinc-800 text-sm"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-zinc-400">Features Checklist (1 per line)</Label>
            <textarea
              rows={4}
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              className="mt-1 w-full rounded-lg bg-zinc-950 border border-zinc-800 p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActiveCheck"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-amber-500 focus:ring-amber-500"
            />
            <label htmlFor="isActiveCheck" className="text-xs font-medium text-zinc-300">
              Active plan (visible in `/upgrade` catalogue)
            </label>
          </div>

          <div className="flex justify-end gap-3 border-t border-zinc-800 pt-5 mt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={submitting}
              className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold gap-1.5"
            >
              <Save className="h-4 w-4" /> {submitting ? "Saving..." : "Save Plan"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
