"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Bot,
  Check,
  Copy,
  CreditCard,
  Dumbbell,
  HelpCircle,
  Info,
  RefreshCw,
  Send,
  Sparkles,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ToggleTheme } from "@/components/lightswind/toggle-theme";
import {
  fetchAiQuota,
  sendAiChatMessage,
  type AiQuotaData,
} from "@/lib/ai-assistant-api";
import { useToast } from "@/components/providers/ToastProvider";
import { cn } from "@/lib/cn";

type Message = {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: Date;
  model?: string;
};

const SUGGESTED_QUESTIONS = [
  {
    label: "Today's Fee Payments",
    icon: Wallet,
    prompt: "How much fee payment did we collect today?",
  },
  {
    label: "Today's New Members",
    icon: Users,
    prompt: "Who are the new members who joined today?",
  },
  {
    label: "Today's Expense Report",
    icon: CreditCard,
    prompt: "What is today's total expense report?",
  },
  {
    label: "Expiring Memberships",
    icon: Dumbbell,
    prompt: "Which memberships are expiring in the next 7 days?",
  },
];

export function GymAiChat() {
  const toast = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      sender: "assistant",
      text: "👋 **Hello! I'm your AI Gym Assistant.**\n\nI am connected directly to your gym's database and can answer real-time questions about your **fee payments**, **new joining members**, **daily expenses**, **renewals**, and **gym statistics**.\n\nAsk me anything about your gym, or click one of the quick suggestions below!",
      timestamp: new Date(),
      model: "Gemini / Gym DB",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [quota, setQuota] = useState<AiQuotaData>({
    gymId: "",
    limit: 3,
    used: 0,
    remaining: 3,
    canAsk: true,
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load quota on initial mount
  useEffect(() => {
    let mounted = true;
    fetchAiQuota().then((data) => {
      if (mounted) setQuota(data);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    if (!quota.canAsk) {
      toast.error(
        "AI Question Limit Reached",
        `You have used all ${quota.limit} questions for today. Contact platform Super Admin to increase your quota.`,
      );
      return;
    }

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    try {
      const response = await sendAiChatMessage(text);
      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        sender: "assistant",
        text: response.reply,
        timestamp: new Date(),
        model: response.model,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      if (response.quota) {
        setQuota(response.quota);
      }
    } catch (err: unknown) {
      const errorMessage =
        err && typeof err === "object" && "message" in err
          ? String(err.message)
          : "Could not retrieve answer from AI assistant.";

      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "assistant",
          text: `⚠️ **Notice:** ${errorMessage}\n\nPlease try again or contact your platform administrator if this persists.`,
          timestamp: new Date(),
        },
      ]);
      // Re-sync quota
      fetchAiQuota().then((q) => setQuota(q));
    } finally {
      setLoading(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Copied to clipboard", "Message content copied.");
  };

  const clearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "assistant",
        text: "✨ **Chat cleared.** How can I help you with your gym operations today?",
        timestamp: new Date(),
        model: "Gemini / Gym DB",
      },
    ]);
  };

  const getQuotaBadgeTone = () => {
    if (quota.remaining >= 2) return "gold";
    if (quota.remaining === 1) return "warning";
    return "danger";
  };

  return (
    <div className="flex h-[calc(100vh-8.5rem)] flex-col rounded-2xl border border-line bg-card/60 shadow-lg backdrop-blur-md transition-colors dark:bg-card/40">
      {/* Header with Quota Counter & Light/Dark Theme Switch */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-line/60 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold/25 via-gold/15 to-transparent text-gold ring-1 ring-gold/30">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-ink sm:text-lg">
                AI Gym Assistant
              </h1>
              <Badge tone="gold" className="text-[10px] uppercase font-bold tracking-wider">
                Gemini Free
              </Badge>
            </div>
            <p className="text-xs text-subtle">
              Real-time database queries & operations for your gym only
            </p>
          </div>
        </div>

        {/* Right side controls: Quota Counter, Theme Toggle, Clear Chat */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Question Quota Pill */}
          <div className="flex items-center gap-1.5 rounded-lg border border-line bg-canvas/60 px-2.5 py-1 text-xs">
            <HelpCircle className="h-3.5 w-3.5 text-faint" />
            <span className="hidden text-faint sm:inline">Questions:</span>
            <Badge tone={getQuotaBadgeTone()} className="font-mono text-xs font-bold">
              {quota.remaining} / {quota.limit} left
            </Badge>
          </div>

          {/* Light / Dark Mode Toggle */}
          <div className="flex items-center rounded-lg border border-line bg-canvas/60 p-1">
            <ToggleTheme animationType="swipe-down" />
          </div>

          {/* Clear Chat Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearChat}
            title="Reset conversation"
            className="h-8 gap-1 text-xs text-faint hover:text-ink"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </Button>
        </div>
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-line/40 bg-panel/30 px-4 py-2.5 scrollbar-none">
        <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-faint">
          Quick queries:
        </span>
        {SUGGESTED_QUESTIONS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              type="button"
              disabled={loading || !quota.canAsk}
              onClick={() => handleSend(item.prompt)}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-canvas/80 px-3 py-1 text-xs font-medium text-subtle transition-all hover:border-gold/40 hover:bg-gold/10 hover:text-gold disabled:opacity-50"
            >
              <Icon className="h-3 w-3 text-gold" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Quota Depleted Warning Banner */}
      {!quota.canAsk && (
        <div className="flex shrink-0 items-center gap-2 border-b border-danger/30 bg-danger/10 px-4 py-2.5 text-xs text-danger">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            <strong>Free Questions Reached ({quota.limit}/{quota.limit}):</strong> You have
            used all questions allocated for today. Please contact your platform Super Admin
            to raise your gym&apos;s AI quota.
          </span>
        </div>
      )}

      {/* Chat Messages Feed */}
      <div
        ref={scrollContainerRef}
        className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5"
      >
        {messages.map((msg) => {
          const isUser = msg.sender === "user";
          return (
            <div
              key={msg.id}
              className={cn(
                "flex items-start gap-3",
                isUser ? "flex-row-reverse" : "flex-row",
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ring-1",
                  isUser
                    ? "bg-gold text-canvas ring-gold/40 shadow-sm"
                    : "bg-panel text-gold ring-gold/30 shadow-sm",
                )}
              >
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={cn(
                  "group relative max-w-[85%] rounded-2xl p-4 text-[13px] leading-relaxed transition-all sm:max-w-[75%]",
                  isUser
                    ? "bg-gold/15 text-ink ring-1 ring-gold/30 rounded-tr-sm"
                    : "bg-panel border border-line/80 text-ink shadow-sm rounded-tl-sm",
                )}
              >
                {/* Content formatted with line breaks and markdown styling */}
                <div className="whitespace-pre-wrap select-text">
                  {msg.text.split("\n").map((line, idx) => {
                    // Bold headers
                    if (line.startsWith("### ") || line.startsWith("## ")) {
                      return (
                        <p key={idx} className="font-bold text-gold my-1.5 text-sm">
                          {line.replace(/^#+\s/, "")}
                        </p>
                      );
                    }
                    // Bullet lists
                    if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
                      return (
                        <div key={idx} className="flex items-start gap-1.5 my-0.5 pl-1">
                          <span className="text-gold">•</span>
                          <span>{line.trim().replace(/^[-•]\s*/, "")}</span>
                        </div>
                      );
                    }
                    return (
                      <p key={idx} className={line === "" ? "h-2" : "my-0.5"}>
                        {line}
                      </p>
                    );
                  })}
                </div>

                {/* Footer with Timestamp & Copy Action */}
                <div
                  className={cn(
                    "mt-2 flex items-center justify-between gap-3 border-t border-line/30 pt-1.5 text-[10px] text-faint",
                    isUser && "justify-end",
                  )}
                >
                  {!isUser && msg.model && (
                    <span className="font-mono text-[9.5px] opacity-75">
                      {msg.model}
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    <span>
                      {msg.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {!isUser && (
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.id, msg.text)}
                        className="rounded p-0.5 text-faint hover:text-ink opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading / Thinking Indicator */}
        {loading && (
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-panel text-gold ring-1 ring-gold/30">
              <Bot className="h-4 w-4 animate-spin" />
            </div>
            <div className="rounded-2xl rounded-tl-sm border border-line/80 bg-panel px-4 py-3 text-xs text-subtle">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-gold" />
                </span>
                <span>Querying gym database & analyzing with Gemini…</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Box Footer */}
      <div className="shrink-0 border-t border-line/60 bg-panel/40 p-3 sm:p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            disabled={loading || !quota.canAsk}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              quota.canAsk
                ? "Ask about today's fee payments, joining members, expenses... (Enter to send)"
                : "Questions limit reached for today. Contact Super Admin to increase quota."
            }
            className="flex-1 rounded-xl border border-line bg-canvas/80 px-4 py-2.5 text-xs text-ink placeholder:text-faint focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold disabled:opacity-50 sm:text-sm"
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={loading || !inputText.trim() || !quota.canAsk}
            className="h-10 px-4 gap-1.5"
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Ask</span>
          </Button>
        </form>
        <p className="mt-2 text-center text-[10.5px] text-faint">
          Strictly gym-isolated: queries live records for your gym only. Powered by Google Gemini free tier.
        </p>
      </div>
    </div>
  );
}

