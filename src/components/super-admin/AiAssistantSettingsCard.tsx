"use client";

import { useEffect, useState } from "react";
import {
  Bot,
  Check,
  HelpCircle,
  Key,
  Layers,
  Save,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/providers/ToastProvider";
import {
  fetchSuperAdminAiSettings,
  updateSuperAdminAiSettings,
  type SuperAdminAiSettings,
} from "@/lib/ai-assistant-api";

export function AiAssistantSettingsCard() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SuperAdminAiSettings>({
    defaultQuestionLimit: 3,
    model: "gemini-1.5-flash",
    apiKeyConfigured: false,
    enabled: true,
  });
  const [apiKeyInput, setApiKeyInput] = useState("");

  useEffect(() => {
    let mounted = true;
    fetchSuperAdminAiSettings()
      .then((data) => {
        if (mounted) {
          setSettings(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateSuperAdminAiSettings({
        defaultQuestionLimit: Number(settings.defaultQuestionLimit) || 3,
        model: settings.model,
        apiKey: apiKeyInput ? apiKeyInput.trim() : undefined,
        enabled: settings.enabled,
      });
      setSettings(updated);
      setApiKeyInput("");
      toast.success(
        "AI Settings Saved",
        `Question quota updated to ${updated.defaultQuestionLimit} queries per gym owner.`,
      );
    } catch {
      toast.error("Failed to save settings", "Could not update AI settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="animate-fade-up rounded-2xl border border-line bg-card/60 p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-gold/12 text-gold ring-1 ring-inset ring-gold/20">
            <Sparkles className="size-4.5" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[14px] font-semibold text-ink">
                AI Gym Assistant & Gemini Settings
              </h2>
              <Badge tone="gold">Super Admin Only</Badge>
            </div>
            <p className="mt-0.5 text-[11.5px] text-faint">
              Configure question limits per gym owner and Gemini model parameters.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {settings.apiKeyConfigured ? (
            <Badge tone="success" dot>
              API Key Configured
            </Badge>
          ) : (
            <Badge tone="neutral" dot>
              Live DB Fallback Active
            </Badge>
          )}
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {/* Default Question Limit */}
        <div>
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-ink">
              Default Question Quota (per Gym Owner)
            </Label>
            <span className="text-[11px] text-faint">
              Default is 3 questions
            </span>
          </div>
          <p className="mt-0.5 text-[11.5px] text-faint">
            Maximum questions a gym owner can ask the AI assistant.
          </p>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={100}
              value={settings.defaultQuestionLimit}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  defaultQuestionLimit: Math.max(1, parseInt(e.target.value) || 1),
                }))
              }
              className="w-32 rounded-lg border border-line bg-canvas/80 px-3 py-1.5 text-sm font-semibold text-ink focus:border-gold focus:outline-none"
            />
            <span className="text-xs text-subtle">queries per day</span>
          </div>
        </div>

        {/* Gemini Model Selection */}
        <div>
          <Label className="text-xs font-semibold text-ink">
            Google Gemini Model
          </Label>
          <p className="mt-0.5 text-[11.5px] text-faint">
            Choose the Gemini AI model to process gym management questions.
          </p>
          <select
            value={settings.model}
            onChange={(e) =>
              setSettings((s) => ({ ...s, model: e.target.value }))
            }
            className="mt-2 w-full max-w-sm rounded-lg border border-line bg-canvas/80 px-3 py-2 text-xs text-ink focus:border-gold focus:outline-none"
          >
            <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast, Free Tier)</option>
            <option value="gemini-2.0-flash">Gemini 2.0 Flash (Next-gen Fast)</option>
            <option value="gemini-1.5-pro">Gemini 1.5 Pro (Advanced Reasoning)</option>
          </select>
        </div>

        {/* API Key Override */}
        <div>
          <Label className="text-xs font-semibold text-ink">
            Gemini API Key
          </Label>
          <p className="mt-0.5 text-[11.5px] text-faint">
            You can define <code className="rounded bg-canvas px-1 py-0.5 font-mono text-[11px] text-gold">GEMINI_API_KEY</code> directly in <code className="rounded bg-canvas px-1 py-0.5 font-mono text-[11px] text-ink">backend/.env</code>, or enter/override the key here in platform settings.
          </p>
          <div className="mt-2 flex max-w-md items-center gap-2">
            <div className="relative flex-1">
              <Key className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-faint" />
              <input
                type="password"
                placeholder={
                  settings.apiKeyConfigured
                    ? "•••••••••••••••••••••••• (API Key Active)"
                    : "Paste Gemini API Key (AIza...)"
                }
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="w-full rounded-lg border border-line bg-canvas/80 py-1.5 pl-9 pr-3 text-xs text-ink placeholder:text-faint focus:border-gold focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="pt-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={saving || loading}
            className="gap-1.5"
          >
            <Save className="size-3.5" />
            {saving ? "Saving…" : "Save AI Controls"}
          </Button>
        </div>
      </div>
    </section>
  );
}

