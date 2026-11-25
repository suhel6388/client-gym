"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoaderWave } from "@/components/loaders/loaderwave";

export default function UpgradeRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/subscription#plans");
  }, [router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <LoaderWave />
    </div>
  );
}
