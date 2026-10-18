import type { Metadata } from "next";
import OAuthCallbackScreenWithSuspense from "./screen";

export const metadata: Metadata = {
  title: "Signing in",
};

export default function OAuthCallbackPage() {
  return <OAuthCallbackScreenWithSuspense />;
}
