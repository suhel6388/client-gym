"use client";

// import { useEffect, useRef, useState } from "react";
// import {
//   AlertCircle,
//   Bot,
//   Check,
//   Copy,
//   CreditCard,
//   Dumbbell,
//   HelpCircle,
//   Info,
//   RefreshCw,
//   Send,
//   Sparkles,
//   User,
//   Users,
//   Wallet,
// } from "lucide-react";
// import { Button } from "@/components/ui/Button";
// import { Badge } from "@/components/ui/Badge";
// import { ToggleTheme } from "@/components/lightswind/toggle-theme";
// import {
//   fetchAiQuota,
//   sendAiChatMessage,
//   type AiQuotaData,
// } from "@/lib/ai-assistant-api";
// import { useToast } from "@/components/providers/ToastProvider";
// import { cn } from "@/lib/cn";

// type Message = {
//   id: string;
//   sender: "user" | "assistant";
//   text: string;
//   timestamp: Date;
//   model?: string;
// };

// const SUGGESTED_QUESTIONS = [
//   {
//     label: "Today's Fee Payments",
//     icon: Wallet,
//     prompt: "How much fee payment did we collect today?",
//   },
//   {
//     label: "Today's New Members",
//     icon: Users,
//     prompt: "Who are the new members who joined today?",
//   },
//   {
//     label: "Today's Expense Report",
//     icon: CreditCard,
//     prompt: "What is today's total expense report?",
//   },
//   {
//     label: "Expiring Memberships",
//     icon: Dumbbell,
//     prompt: "Which memberships are expiring in the next 7 days?",
//   },
// ];

// export function GymAiChat() {
//   const toast = useToast();
//   const [messages, setMessages] = useState<Message[]>([
//     {
//       id: "welcome-1",
//       sender: "assistant",
//       text: "👋 **Hello! I'm your AI Gym Assistant.**\n\nI am connected directly to your gym's database and can answer real-time questions about your **fee payments**, **new joining members**, **daily expenses**, **renewals**, and **gym statistics**.\n\nAsk me anything about your gym, or click one of the quick suggestions below!",
//       timestamp: new Date(),
//       model: "Gemini / Gym DB",
//     },
//   ]);
//   const [inputText, setInputText] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [copiedId, setCopiedId] = useState<string | null>(null);
//   const [quota, setQuota] = useState<AiQuotaData>({
//     gymId: "",
//     limit: 3,
//     used: 0,
//     remaining: 3,
//     canAsk: true,
//   });

//   const scrollContainerRef = useRef<HTMLDivElement>(null);
//   const inputRef = useRef<HTMLInputElement>(null);

//   // Load quota on initial mount
//   useEffect(() => {
//     let mounted = true;
//     fetchAiQuota().then((data) => {
//       if (mounted) setQuota(data);
//     });
//     return () => {
//       mounted = false;
//     };
//   }, []);

//   // Auto-scroll to bottom of chat
//   useEffect(() => {
//     if (scrollContainerRef.current) {
//       scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
//     }
//   }, [messages, loading]);

//   const handleSend = async (textToSend?: string) => {
//     const text = (textToSend || inputText).trim();
//     if (!text || loading) return;

//     if (!quota.canAsk) {
//       toast.error(
//         "AI Question Limit Reached",
//         `You have used all ${quota.limit} questions for today. Contact platform Super Admin to increase your quota.`,
//       );
//       return;
//     }

//     const userMsg: Message = {
//       id: `u-${Date.now()}`,
//       sender: "user",
//       text,
//       timestamp: new Date(),
//     };

//     setMessages((prev) => [...prev, userMsg]);
//     setInputText("");
//     setLoading(true);

//     try {
//       const response = await sendAiChatMessage(text);
//       const assistantMsg: Message = {
//         id: `a-${Date.now()}`,
//         sender: "assistant",
//         text: response.reply,
//         timestamp: new Date(),
//         model: response.model,
//       };
//       setMessages((prev) => [...prev, assistantMsg]);
//       if (response.quota) {
//         setQuota(response.quota);
//       }
//     } catch (err: unknown) {
//       const errorMessage =
//         err && typeof err === "object" && "message" in err
//           ? String(err.message)
//           : "Could not retrieve answer from AI assistant.";

//       setMessages((prev) => [
//         ...prev,
//         {
//           id: `err-${Date.now()}`,
//           sender: "assistant",
//           text: `⚠️ **Notice:** ${errorMessage}\n\nPlease try again or contact your platform administrator if this persists.`,
//           timestamp: new Date(),
//         },
//       ]);
//       // Re-sync quota
//       fetchAiQuota().then((q) => setQuota(q));
//     } finally {
//       setLoading(false);
//       requestAnimationFrame(() => inputRef.current?.focus());
//     }
//   };

//   const handleCopy = (id: string, text: string) => {
//     navigator.clipboard.writeText(text);
//     setCopiedId(id);
//     setTimeout(() => setCopiedId(null), 2000);
//     toast.success("Copied to clipboard", "Message content copied.");
//   };

//   const clearChat = () => {
//     setMessages([
//       {
//         id: `welcome-${Date.now()}`,
//         sender: "assistant",
//         text: "✨ **Chat cleared.** How can I help you with your gym operations today?",
//         timestamp: new Date(),
//         model: "Gemini / Gym DB",
//       },
//     ]);
//   };

//   const getQuotaBadgeTone = () => {
//     if (quota.remaining >= 2) return "gold";
//     if (quota.remaining === 1) return "warning";
//     return "danger";
//   };

//   return (
//     <div className="flex h-[calc(100vh-8.5rem)] flex-col rounded-2xl border border-line bg-card/60 shadow-lg backdrop-blur-md transition-colors dark:bg-card/40">
//       {/* Header with Quota Counter & Light/Dark Theme Switch */}
//       <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-line/60 px-5 py-4">
//         <div className="flex items-center gap-3">
//           <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold/25 via-gold/15 to-transparent text-gold ring-1 ring-gold/30">
//             <Sparkles className="h-5 w-5 animate-pulse" />
//           </div>
//           <div>
//             <div className="flex items-center gap-2">
//               <h1 className="text-base font-bold text-ink sm:text-lg">
//                 AI Gym Assistant
//               </h1>
//               <Badge tone="gold" className="text-[10px] uppercase font-bold tracking-wider">
//                 For Gym
//               </Badge>
//             </div>
//             <p className="text-xs text-subtle">
//               Real-time database queries & operations for your gym only
//             </p>
//           </div>
//         </div>

//         {/* Right side controls: Quota Counter, Theme Toggle, Clear Chat */}
//         <div className="flex items-center gap-2 sm:gap-3">
//           {/* Live Question Quota Pill */}
//           <div className="flex items-center gap-1.5 rounded-lg border border-line bg-canvas/60 px-2.5 py-1 text-xs">
//             <HelpCircle className="h-3.5 w-3.5 text-faint" />
//             <span className="hidden text-faint sm:inline">Questions:</span>
//             <Badge tone={getQuotaBadgeTone()} className="font-mono text-xs font-bold">
//               {quota.remaining} / {quota.limit} left
//             </Badge>
//           </div>

//           {/* Light / Dark Mode Toggle */}
//           <div className="flex items-center rounded-lg border border-line bg-canvas/60 p-1">
//             <ToggleTheme animationType="swipe-down" />
//           </div>

//           {/* Clear Chat Button */}
//           <Button
//             variant="ghost"
//             size="sm"
//             onClick={clearChat}
//             title="Reset conversation"
//             className="h-8 gap-1 text-xs text-faint hover:text-ink"
//           >
//             <RefreshCw className="h-3.5 w-3.5" />
//             <span className="hidden sm:inline">Clear</span>
//           </Button>
//         </div>
//       </div>

//       {/* Suggested Quick Prompt Chips */}
//       <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-line/40 bg-panel/30 px-4 py-2.5 scrollbar-none">
//         <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-faint">
//           Quick queries:
//         </span>
//         {SUGGESTED_QUESTIONS.map((item) => {
//           const Icon = item.icon;
//           return (
//             <button
//               key={item.label}
//               type="button"
//               disabled={loading || !quota.canAsk}
//               onClick={() => handleSend(item.prompt)}
//               className="flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-canvas/80 px-3 py-1 text-xs font-medium text-subtle transition-all hover:border-gold/40 hover:bg-gold/10 hover:text-gold disabled:opacity-50"
//             >
//               <Icon className="h-3 w-3 text-gold" />
//               <span>{item.label}</span>
//             </button>
//           );
//         })}
//       </div>

//       {/* Quota Depleted Warning Banner */}
//       {!quota.canAsk && (
//         <div className="flex shrink-0 items-center gap-2 border-b border-danger/30 bg-danger/10 px-4 py-2.5 text-xs text-danger">
//           <AlertCircle className="h-4 w-4 shrink-0" />
//           <span>
//             <strong>Free Questions Reached ({quota.limit}/{quota.limit}):</strong> You have
//             used all questions allocated for today. Please contact your platform Super Admin
//             to raise your gym&apos;s AI quota.
//           </span>
//         </div>
//       )}

//       {/* Chat Messages Feed */}
//       <div
//         ref={scrollContainerRef}
//         className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5"
//       >
//         {messages.map((msg) => {
//           const isUser = msg.sender === "user";
//           return (
//             <div
//               key={msg.id}
//               className={cn(
//                 "flex items-start gap-3",
//                 isUser ? "flex-row-reverse" : "flex-row",
//               )}
//             >
//               {/* Avatar */}
//               <div
//                 className={cn(
//                   "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ring-1",
//                   isUser
//                     ? "bg-gold text-canvas ring-gold/40 shadow-sm"
//                     : "bg-panel text-gold ring-gold/30 shadow-sm",
//                 )}
//               >
//                 {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
//               </div>

//               {/* Message Bubble */}
//               <div
//                 className={cn(
//                   "group relative max-w-[85%] rounded-2xl p-4 text-[13px] leading-relaxed transition-all sm:max-w-[75%]",
//                   isUser
//                     ? "bg-gold/15 text-ink ring-1 ring-gold/30 rounded-tr-sm"
//                     : "bg-panel border border-line/80 text-ink shadow-sm rounded-tl-sm",
//                 )}
//               >
//                 {/* Content formatted with line breaks and markdown styling */}
//                 <div className="whitespace-pre-wrap select-text">
//                   {msg.text.split("\n").map((line, idx) => {
//                     // Bold headers
//                     if (line.startsWith("### ") || line.startsWith("## ")) {
//                       return (
//                         <p key={idx} className="font-bold text-gold my-1.5 text-sm">
//                           {line.replace(/^#+\s/, "")}
//                         </p>
//                       );
//                     }
//                     // Bullet lists
//                     if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
//                       return (
//                         <div key={idx} className="flex items-start gap-1.5 my-0.5 pl-1">
//                           <span className="text-gold">•</span>
//                           <span>{line.trim().replace(/^[-•]\s*/, "")}</span>
//                         </div>
//                       );
//                     }
//                     return (
//                       <p key={idx} className={line === "" ? "h-2" : "my-0.5"}>
//                         {line}
//                       </p>
//                     );
//                   })}
//                 </div>

//                 {/* Footer with Timestamp & Copy Action */}
//                 <div
//                   className={cn(
//                     "mt-2 flex items-center justify-between gap-3 border-t border-line/30 pt-1.5 text-[10px] text-faint",
//                     isUser && "justify-end",
//                   )}
//                 >
//                   {!isUser && msg.model && (
//                     <span className="font-mono text-[9.5px] opacity-75">
//                       {msg.model}
//                     </span>
//                   )}
//                   <div className="flex items-center gap-2">
//                     <span>
//                       {msg.timestamp.toLocaleTimeString([], {
//                         hour: "2-digit",
//                         minute: "2-digit",
//                       })}
//                     </span>
//                     {!isUser && (
//                       <button
//                         type="button"
//                         onClick={() => handleCopy(msg.id, msg.text)}
//                         className="rounded p-0.5 text-faint hover:text-ink opacity-0 group-hover:opacity-100 transition-opacity"
//                         title="Copy text"
//                       >
//                         {copiedId === msg.id ? (
//                           <Check className="h-3 w-3 text-emerald-400" />
//                         ) : (
//                           <Copy className="h-3 w-3" />
//                         )}
//                       </button>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           );
//         })}

//         {/* Loading / Thinking Indicator */}
//         {loading && (
//           <div className="flex items-start gap-3">
//             <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-panel text-gold ring-1 ring-gold/30">
//               <Bot className="h-4 w-4 animate-spin" />
//             </div>
//             <div className="rounded-2xl rounded-tl-sm border border-line/80 bg-panel px-4 py-3 text-xs text-subtle">
//               <div className="flex items-center gap-2">
//                 <span className="relative flex h-2 w-2">
//                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75" />
//                   <span className="relative inline-flex rounded-full h-2 w-2 bg-gold" />
//                 </span>
//                 <span>Querying gym database & analyzing with Gemini…</span>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Input Box Footer */}
//       <div className="shrink-0 border-t border-line/60 bg-panel/40 p-3 sm:p-4">
//         <form
//           onSubmit={(e) => {
//             e.preventDefault();
//             handleSend();
//           }}
//           className="flex items-center gap-2"
//         >
//           <input
//             ref={inputRef}
//             type="text"
//             value={inputText}
//             disabled={loading || !quota.canAsk}
//             onChange={(e) => setInputText(e.target.value)}
//             placeholder={
//               quota.canAsk
//                 ? "Ask about today's fee payments, joining members, expenses... (Enter to send)"
//                 : "Questions limit reached for today. Contact Super Admin to increase quota."
//             }
//             className="flex-1 rounded-xl border border-line bg-canvas/80 px-4 py-2.5 text-xs text-ink placeholder:text-faint focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold disabled:opacity-50 sm:text-sm"
//           />
//           <Button
//             type="submit"
//             variant="primary"
//             size="md"
//             disabled={loading || !inputText.trim() || !quota.canAsk}
//             className="h-10 px-4 gap-1.5"
//           >
//             <Send className="h-4 w-4" />
//             <span className="hidden sm:inline">Ask</span>
//           </Button>
//         </form>
//         <p className="mt-2 text-center text-[10.5px] text-faint">
//           Strictly gym-isolated: queries live records for your gym only. Powered by Google Gemini free tier.
//         </p>
//       </div>
//     </div>
//   );
// }



import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import {
  AlertCircle,
  ArrowUp,
  Check,
  Copy,
  CreditCard,
  Dumbbell,
  RotateCcw,
  Sparkles,
  SquarePen,
  Users,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
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
  isError?: boolean;
  retryText?: string;
};

const SUGGESTED_QUESTIONS = [
  {
    label: "Today's fee payments",
    hint: "Total collected so far",
    icon: Wallet,
    prompt: "How much fee payment did we collect today?",
  },
  {
    label: "New members today",
    hint: "Who joined the gym",
    icon: Users,
    prompt: "Who are the new members who joined today?",
  },
  {
    label: "Today's expenses",
    hint: "Spending summary",
    icon: CreditCard,
    prompt: "What is today's total expense report?",
  },
  {
    label: "Expiring memberships",
    hint: "Renewals due in 7 days",
    icon: Dumbbell,
    prompt: "Which memberships are expiring in the next 7 days?",
  },
];

/* ------------------------------------------------------------------ */
/* Lightweight markdown renderer (bold, inline code, headings, lists)  */
/* ------------------------------------------------------------------ */

function renderInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={i} className="font-semibold text-ink">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={i}
          className="rounded-md bg-panel px-1.5 py-0.5 font-mono text-[0.85em] ring-1 ring-line/70"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

function RichText({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flushList = () => {
    if (!list) return;
    const Tag = list.ordered ? "ol" : "ul";
    blocks.push(
      <Tag
        key={`l-${blocks.length}`}
        className={cn(
          "my-2 space-y-1.5 pl-5",
          list.ordered ? "list-decimal" : "list-disc",
          "marker:text-faint",
        )}
      >
        {list.items.map((item, i) => (
          <li key={i} className="pl-1">
            {renderInline(item)}
          </li>
        ))}
      </Tag>,
    );
    list = null;
  };

  lines.forEach((raw, idx) => {
    const line = raw.trim();
    const bullet = line.match(/^[-•*]\s+(.*)/);
    const numbered = line.match(/^\d+[.)]\s+(.*)/);

    if (bullet) {
      if (!list || list.ordered) {
        flushList();
        list = { ordered: false, items: [] };
      }
      list.items.push(bullet[1]);
      return;
    }
    if (numbered) {
      if (!list || !list.ordered) {
        flushList();
        list = { ordered: true, items: [] };
      }
      list.items.push(numbered[1]);
      return;
    }

    flushList();
    if (!line) return;

    if (/^#{1,4}\s/.test(line)) {
      blocks.push(
        <h3 key={idx} className="mb-1 mt-4 text-[15px] font-semibold text-ink first:mt-0">
          {renderInline(line.replace(/^#+\s/, ""))}
        </h3>,
      );
      return;
    }
    blocks.push(
      <p key={idx} className="my-2 first:mt-0 last:mb-0">
        {renderInline(line)}
      </p>,
    );
  });
  flushList();

  return <div className="select-text">{blocks}</div>;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function GymAiChat() {
  const toast = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
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

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isEmpty = messages.length === 0;

  useEffect(() => {
    let mounted = true;
    fetchAiQuota().then((data) => {
      if (mounted) setQuota(data);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [inputText]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend ?? inputText).trim();
    if (!text || loading) return;

    if (!quota.canAsk) {
      toast.error(
        "Daily question limit reached",
        `You have used all ${quota.limit} questions for today. Ask your platform Super Admin to raise the limit.`,
      );
      return;
    }

    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, sender: "user", text, timestamp: new Date() },
    ]);
    setInputText("");
    setLoading(true);

    try {
      const response = await sendAiChatMessage(text);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          sender: "assistant",
          text: response.reply,
          timestamp: new Date(),
          model: response.model,
        },
      ]);
      if (response.quota) setQuota(response.quota);
    } catch (err: unknown) {
      const errorMessage =
        err && typeof err === "object" && "message" in err
          ? String(err.message)
          : "Could not get an answer from the AI assistant.";

      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "assistant",
          text: errorMessage,
          timestamp: new Date(),
          isError: true,
          retryText: text,
        },
      ]);
      fetchAiQuota().then(setQuota);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      toast.error("Couldn't copy", "Your browser blocked clipboard access.");
    }
  };

  const clearChat = () => {
    setMessages([]);
    setInputText("");
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const quotaTone =
    quota.remaining >= 2 ? "gold" : quota.remaining === 1 ? "warning" : "danger";

  const canSubmit = !loading && quota.canAsk && inputText.trim().length > 0;

  return (
    <div className="relative flex h-[calc(100vh-8.5rem)] flex-col overflow-hidden rounded-2xl border border-line bg-canvas/60 shadow-lg ">
      {/* ---------- Top bar: quiet, Claude-like ---------- */}
      <header className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/15 text-gold ring-1 ring-gold/30">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <h1 className="text-sm font-semibold text-ink">Gym Assistant</h1>
            <p className="hidden text-[11px] text-faint sm:block">
              Answers from your gym&apos;s live records
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge tone={quotaTone} className="font-mono text-[11px] font-semibold">
            {quota.remaining}/{quota.limit} left today
          </Badge>
          <div className="flex items-center rounded-lg border border-line bg-canvas/60 p-1">
            {/* <ToggleTheme animationType="swipe-down" /> */}
          </div>
          <button
            type="button"
            onClick={clearChat}
            disabled={isEmpty && !inputText}
            title="New chat"
            className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-subtle transition-colors hover:bg-panel hover:text-ink disabled:pointer-events-none disabled:opacity-40"
          >
            <SquarePen className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New chat</span>
          </button>
        </div>
      </header>

      {/* ---------- Conversation ---------- */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-smooth">
        <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 pb-6 sm:px-6">
          {isEmpty ? (
            <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/15 text-gold ring-1 ring-gold/30">
                <Sparkles className="h-7 w-7" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                What would you like to know about your gym?
              </h2>
              <p className="mt-2 max-w-md text-sm text-subtle">
                Ask about payments, new members, expenses or renewals. Answers come from
                today&apos;s data.
              </p>

              <div className="mt-8 grid w-full max-w-xl grid-cols-1 gap-2.5 sm:grid-cols-2">
                {SUGGESTED_QUESTIONS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      disabled={loading || !quota.canAsk}
                      onClick={() => handleSend(item.prompt)}
                      className="group flex items-start gap-3 rounded-xl border border-line bg-panel/50 p-3.5 text-left transition-colors hover:border-gold/50 hover:bg-gold/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-50"
                    >
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-canvas text-gold ring-1 ring-line">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-medium text-ink">
                          {item.label}
                        </span>
                        <span className="block text-xs text-faint">{item.hint}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-7 pt-4">
              {messages.map((msg) => {
                const isUser = msg.sender === "user";

                if (isUser) {
                  return (
                    <div key={msg.id} className="flex justify-end">
                      <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-panel px-4 py-2.5 text-[15px] leading-relaxed text-ink ring-1 ring-line/70 sm:max-w-[75%]">
                        {msg.text}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className="group flex items-start gap-3">
                    <div
                      className={cn(
                        "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1",
                        msg.isError
                          ? "bg-danger/10 text-danger ring-danger/30"
                          : "bg-gold/15 text-gold ring-gold/30",
                      )}
                    >
                      {msg.isError ? (
                        <AlertCircle className="h-4 w-4" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      {msg.isError ? (
                        <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-ink">
                          <p className="font-medium text-danger">Something went wrong</p>
                          <p className="mt-1 text-subtle">{msg.text}</p>
                          {msg.retryText && (
                            <button
                              type="button"
                              onClick={() => handleSend(msg.retryText)}
                              disabled={loading || !quota.canAsk}
                              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-line bg-canvas px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-gold/50 disabled:opacity-50"
                            >
                              <RotateCcw className="h-3 w-3" />
                              Try again
                            </button>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className="text-[15px] leading-7 text-ink">
                            <RichText text={msg.text} />
                          </div>

                          <div className="mt-1.5 flex items-center gap-3 text-[11px] text-faint">
                            <button
                              type="button"
                              onClick={() => handleCopy(msg.id, msg.text)}
                              title="Copy"
                              className="flex items-center gap-1 rounded-md p-1 transition-colors hover:bg-panel hover:text-ink"
                            >
                              {copiedId === msg.id ? (
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                              <span>{copiedId === msg.id ? "Copied" : "Copy"}</span>
                            </button>
                            <span>
                              {msg.timestamp.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {msg.model && (
                              <span className="hidden font-mono opacity-70 sm:inline">
                                {msg.model}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Thinking indicator */}
              {loading && (
                <div className="flex items-start gap-3" aria-live="polite">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold ring-1 ring-gold/30">
                    <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                  </div>
                  <div className="flex items-center gap-2 pt-1.5 text-sm text-subtle">
                    <span className="flex items-center gap-1" aria-hidden>
                      {[0, 150, 300].map((delay) => (
                        <span
                          key={delay}
                          className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold"
                          style={{ animationDelay: `${delay}ms` }}
                        />
                      ))}
                    </span>
                    <span>Checking your gym data…</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ---------- Composer ---------- */}
      <div className="shrink-0 px-4 pb-3 pt-1 sm:px-6">
        <div className="mx-auto w-full max-w-3xl">
          {!quota.canAsk && (
            <div className="mb-2 flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-xs text-danger">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                You&apos;ve used all {quota.limit} questions for today. Ask your platform Super
                Admin to raise your gym&apos;s limit.
              </span>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className={cn(
              "flex items-end gap-2 rounded-2xl border border-line bg-panel/70 p-2 shadow-sm transition-colors",
              "focus-within:border-gold/60 focus-within:ring-2 focus-within:ring-gold/20",
              !quota.canAsk && "opacity-60",
            )}
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              disabled={loading || !quota.canAsk}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={
                quota.canAsk ? "Ask about payments, members, expenses…" : "Daily limit reached"
              }
              aria-label="Message the gym assistant"
              className="max-h-[180px] flex-1 resize-none bg-transparent px-2.5 py-2 text-[15px] leading-6 text-ink outline-none placeholder:text-faint disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={!canSubmit}
              aria-label="Send message"
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all",
                canSubmit
                  ? "bg-gold text-canvas hover:brightness-110 active:scale-95"
                  : "bg-line/60 text-faint",
              )}
            >
              <ArrowUp className="h-[18px] w-[18px]" strokeWidth={2.5} />
            </button>
          </form>

          <p className="mt-2 text-center text-[11px] text-faint">
            <kbd className="font-sans">Enter</kbd> to send · <kbd className="font-sans">Shift + Enter</kbd> for a new line. Answers use only your gym&apos;s records, so double-check important numbers.
          </p>
        </div>
      </div>
    </div>
  );
}



