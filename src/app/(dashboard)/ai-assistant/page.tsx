import type { Metadata } from "next";
import { GymAiChat } from "@/components/ai-assistant/GymAiChat";

export const metadata: Metadata = {
  title: "AI Gym Assistant",
  description: "Real-time AI assistant for gym fee collections, members, and expenses.",
};

export default function AiAssistantPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-6">
      <GymAiChat />
    </div>
  );
}

