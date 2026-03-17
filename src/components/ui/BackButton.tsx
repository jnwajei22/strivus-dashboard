"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

type BackButtonProps = {
  href: string;
  label?: string;
  className?: string;
  preferHistoryBack?: boolean;
};

export function BackButton({
  href,
  label = "Back",
  className = "",
  preferHistoryBack = false,
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (preferHistoryBack && typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(href);
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors ${className}`}
    >
      <ArrowLeft className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}