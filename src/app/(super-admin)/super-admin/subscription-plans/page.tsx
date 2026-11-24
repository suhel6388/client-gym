"use client";

import { useState, useEffect } from "react";
import { Plus, CreditCard, RefreshCw } from "lucide-react";
import {
  listAdminPlans,
  createAdminPlan,
  updateAdminPlan,
  toggleAdminPlanStatus,
  deleteAdminPlan,
  type BillingPlan,
} from "@/lib/api/billing";
import { PlanTable } from "@/components/super-admin/subscriptions/PlanTable";
import { PlanForm } from "@/components/super-admin/subscriptions/PlanForm";
import { Button } from "@/components/ui/Button";

export default function SuperAdminSubscriptionPlansPage() {
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<BillingPlan | null>(null);

  const loadPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listAdminPlans();
      setPlans(data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load SaaS plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleCreateOrUpdate = async (formData: Partial<BillingPlan>) => {
    if (editingPlan) {
      await updateAdminPlan(editingPlan.id, formData);
    } else {
      await createAdminPlan(formData);
    }
    await loadPlans();
  };

  const handleToggleStatus = async (plan: BillingPlan) => {
    try {
      await toggleAdminPlanStatus(plan.id, !plan.isActive);
      await loadPlans();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Could not toggle status");
    }
  };

  const handleDelete = async (plan: BillingPlan) => {
    if (!confirm(`Are you sure you want to delete ${plan.name}? Past subscriptions will preserve snapshot data.`)) {
      return;
    }
    try {
      await deleteAdminPlan(plan.id);
      await loadPlans();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Could not delete plan");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-amber-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              SaaS Subscription Plans
            </h1>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Define plan tiers, configure base pricing, GST percentages, duration and feature limits.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={loadPlans}
            disabled={loading}
            className="border-zinc-800 text-zinc-400 hover:text-white"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setEditingPlan(null);
              setFormOpen(true);
            }}
            className="bg-amber-500 hover:bg-amber-400 text-black font-bold gap-1 text-xs"
          >
            <Plus className="h-4 w-4" /> Create Plan
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/20 p-4 text-xs text-rose-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-xs text-zinc-400">Loading plan catalogue...</div>
      ) : (
        <PlanTable
          plans={plans}
          onEdit={(plan) => {
            setEditingPlan(plan);
            setFormOpen(true);
          }}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDelete}
        />
      )}

      {formOpen && (
        <PlanForm
          isOpen={formOpen}
          initialData={editingPlan}
          onClose={() => {
            setFormOpen(false);
            setEditingPlan(null);
          }}
          onSubmit={handleCreateOrUpdate}
        />
      )}
    </div>
  );
}
