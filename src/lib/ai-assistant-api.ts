import { apiRequest } from "./api";

export type AiQuotaData = {
  gymId: string;
  limit: number;
  used: number;
  remaining: number;
  canAsk: boolean;
};

export type AiChatResponse = {
  reply: string;
  quota: AiQuotaData;
  model: string;
};

export type SuperAdminAiSettings = {
  defaultQuestionLimit: number;
  model: string;
  apiKeyConfigured: boolean;
  enabled: boolean;
};

export async function fetchAiQuota(): Promise<AiQuotaData> {
  try {
    const res = await apiRequest<AiQuotaData>("/ai-assistant/quota");
    return res;
  } catch (err) {
    // Return safe default if network/session unavailable
    return {
      gymId: "current",
      limit: 3,
      used: 0,
      remaining: 3,
      canAsk: true,
    };
  }
}

export async function sendAiChatMessage(message: string): Promise<AiChatResponse> {
  const res = await apiRequest<AiChatResponse>("/ai-assistant/chat", {
    method: "POST",
    body: { message },
  });
  return res;
}

export async function fetchSuperAdminAiSettings(): Promise<SuperAdminAiSettings> {
  const res = await apiRequest<SuperAdminAiSettings>("/super-admin/ai-settings");
  return res;
}

export async function updateSuperAdminAiSettings(data: {
  defaultQuestionLimit?: number;
  model?: string;
  apiKey?: string;
  enabled?: boolean;
}): Promise<SuperAdminAiSettings> {
  const res = await apiRequest<SuperAdminAiSettings>("/super-admin/ai-settings", {
    method: "PUT",
    body: data,
  });
  return res;
}

