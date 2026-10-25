"use client";

import { useState, type FormEvent } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Phone, Mail, MessageCircle, Send, CheckCircle2 } from "lucide-react";

/* ---------- Config ---------- */

const PHONE_DISPLAY = "+91 63889 39189";
const PHONE_TEL = "+916388939189";
const WHATSAPP_NUMBER = "916388939189"; // country code + number, no "+" or spaces
const WHATSAPP_TEXT = "Hi, I need your gym service";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  WHATSAPP_TEXT
)}`;

const EMAIL = "suhelali72786@gmail.com";
const FORM_ENDPOINT = `https://formsubmit.co/ajax/${EMAIL}`;

/* ---------- Animation variants ---------- */

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.13, delayChildren: 0.05 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

const reduced: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.3 } },
};

type Status = "idle" | "sending" | "success" | "error";

const inputClass =
  "w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-lp-ink placeholder:text-lp-muted/45 transition-colors duration-200 hover:border-white/[0.14] focus:border-lp-gold focus:outline-none focus:ring-1 focus:ring-lp-gold/50";

/* ---------- Component ---------- */

export default function GymContact() {
  const prefersReduced = useReducedMotion();
  const v = prefersReduced ? reduced : item;

  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    // Honeypot: bots fill this hidden field, humans don't
    if (data.get("_honey")) return;

    setStatus("sending");
    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone"),
          message: data.get("message"),
          _subject: "New gym service enquiry",
          _template: "table",
          _captcha: "false",
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <section
      id="contact"
      className="dg-lp-section relative isolate w-full overflow-hidden text-lp-ink"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-1/4 -z-10 h-[420px] w-[520px] rounded-full bg-lp-gold/[0.055] blur-3xl"
      />
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-lp-line/40" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-lp-line/30" />

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="mx-auto max-w-[1200px] px-6 py-16 sm:px-10 lg:py-20"
      >
        {/* ---------- Heading ---------- */}
        <div className="text-center">
          <motion.p
            variants={v}
            className="text-xs font-semibold uppercase tracking-wider text-lp-gold"
          >
            Contact Us
          </motion.p>
          <motion.h2
            variants={v}
            className="mt-3 text-balance text-3xl font-semibold tracking-[-0.02em] sm:text-4xl"
          >
            Let&apos;s get your gym running smoothly
          </motion.h2>
          <motion.p
            variants={v}
            className="mx-auto mt-3 max-w-xl text-sm text-lp-muted"
          >
            Message us on WhatsApp for a quick reply, or send us the form and we&apos;ll
            get back to you.
          </motion.p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          {/* ---------- Left: contact cards ---------- */}
          <div className="flex flex-col gap-4">
            <motion.a
              variants={v}
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 rounded-xl border border-lp-gold/55 bg-lp-gold/[0.055] p-5 shadow-[0_0_44px_-18px_rgba(245,179,35,0.55)] transition-all duration-300 hover:-translate-y-0.5 hover:border-lp-gold/80 hover:bg-lp-gold/[0.09]"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#FFD15C_0%,#F5B323_55%,#EFAE14_100%)] text-[#171203] shadow-[0_8px_20px_-10px_rgba(245,179,35,0.9)]">
                <MessageCircle className="size-6" strokeWidth={2} aria-hidden />
              </span>
              <span>
                <span className="block text-base font-semibold text-lp-ink">
                  Chat on WhatsApp
                </span>
                <span className="block text-sm text-lp-muted">
                  Fastest way to reach us
                </span>
              </span>
            </motion.a>

            <motion.a
              variants={v}
              href={`tel:${PHONE_TEL}`}
              className="group flex items-center gap-4 rounded-xl border border-white/[0.07] bg-white/[0.025] p-5 transition-all duration-300 hover:border-lp-gold/40 hover:bg-lp-gold/[0.04]"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-lp-gold/45 bg-lp-gold/[0.06] text-lp-gold transition-colors group-hover:border-lp-gold/70 group-hover:bg-lp-gold/[0.12]">
                <Phone className="size-5" strokeWidth={1.75} aria-hidden />
              </span>
              <span>
                <span className="block text-sm text-lp-muted">Call us</span>
                <span className="block text-base font-semibold text-lp-ink">
                  {PHONE_DISPLAY}
                </span>
              </span>
            </motion.a>

            <motion.a
              variants={v}
              href={`mailto:${EMAIL}`}
              className="group flex items-center gap-4 rounded-xl border border-white/[0.07] bg-white/[0.025] p-5 transition-all duration-300 hover:border-lp-gold/40 hover:bg-lp-gold/[0.04]"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-lp-gold/45 bg-lp-gold/[0.06] text-lp-gold transition-colors group-hover:border-lp-gold/70 group-hover:bg-lp-gold/[0.12]">
                <Mail className="size-5" strokeWidth={1.75} aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-sm text-lp-muted">Email us</span>
                <span className="block truncate text-base font-semibold text-lp-ink">
                  {EMAIL}
                </span>
              </span>
            </motion.a>
          </div>

          {/* ---------- Right: form ---------- */}
          <motion.div
            variants={v}
            className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-6 backdrop-blur-sm sm:p-8"
          >
            {status === "success" ? (
              <div
                role="status"
                className="flex h-full min-h-[320px] flex-col items-center justify-center text-center"
              >
                <CheckCircle2
                  className="size-12 text-lp-gold"
                  strokeWidth={1.5}
                  aria-hidden
                />
                <h3 className="mt-4 text-xl font-semibold text-lp-ink">
                  Message sent
                </h3>
                <p className="mt-2 max-w-xs text-sm text-lp-muted">
                  Thanks for reaching out. We&apos;ll reply as soon as we can.
                </p>
                <button
                  type="button"
                  onClick={() => setStatus("idle")}
                  className="mt-6 rounded-lg border border-lp-gold/45 px-5 py-2.5 text-sm font-semibold text-lp-gold-highlight transition-all duration-300 hover:border-lp-gold/80 hover:bg-lp-gold/[0.08]"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-xl font-semibold text-lp-ink">
                  Send us a message
                </h3>

                {/* Honeypot (hidden from users) */}
                <input
                  type="text"
                  name="_honey"
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  aria-hidden="true"
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="name"
                      className="mb-1.5 block text-xs text-lp-muted"
                    >
                      Your name
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      placeholder="Full name"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-1.5 block text-xs text-lp-muted"
                    >
                      Phone number
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+91"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-xs text-lp-muted"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="mb-1.5 block text-xs text-lp-muted"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    required
                    placeholder="Tell us about your gym and what you need"
                    className={`${inputClass} resize-none`}
                  />
                </div>

                {status === "error" && (
                  <p role="alert" className="text-sm text-red-400">
                    Something went wrong. Please try again or message us on WhatsApp.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[linear-gradient(135deg,#FFD15C_0%,#F5B323_55%,#EFAE14_100%)] px-4 py-3 text-sm font-semibold text-[#171203] shadow-[0_12px_28px_-14px_rgba(245,179,35,0.75)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_-12px_rgba(245,179,35,0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-gold-highlight disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  <Send className="size-4" aria-hidden />
                  {status === "sending" ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
