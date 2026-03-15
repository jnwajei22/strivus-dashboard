"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Shield,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type VerifyState = "input" | "verifying" | "success" | "invalid" | "expired";

export default function VerifyCode() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const email = (searchParams.get("email") || "").trim().toLowerCase();

  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const [state, setState] = useState<VerifyState>("input");
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) {
      router.replace("/auth/login");
    }
  }, [email, router]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCooldown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const next = [...code];
    next[index] = value.slice(-1);
    setCode(next);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = Array(6).fill("");

    pasted.split("").forEach((c, i) => {
      next[i] = c;
    });

    setCode(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerify = async () => {
    const fullCode = code.join("");
    if (fullCode.length < 6 || !email) return;

    setState("verifying");

    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          code: fullCode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const message = data.error || "Failed to verify code";

        if (message.toLowerCase().includes("expired")) {
          setState("expired");
          return;
        }

        setState("invalid");
        setTimeout(() => {
          setState("input");
          setCode(Array(6).fill(""));
          inputRefs.current[0]?.focus();
        }, 1500);
        return;
      }

      setState("success");

      toast({
        title: "Welcome back",
        description: "You are now signed in.",
      });

      setTimeout(() => {
        router.replace("/overview");
        router.refresh();
      }, 800);
    } catch (error) {
      setState("invalid");

      toast({
        title: "Verification failed",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });

      setTimeout(() => {
        setState("input");
        setCode(Array(6).fill(""));
        inputRefs.current[0]?.focus();
      }, 1500);
    }
  };

  const handleResend = async () => {
    if (!email) return;

    try {
      const res = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to resend code");
      }

      setResendCooldown(30);

      toast({
        title: "Code resent",
        description: `A new code has been sent to ${email}`,
      });
    } catch (error) {
      toast({
        title: "Resend failed",
        description:
          error instanceof Error ? error.message : "Could not resend code",
        variant: "destructive",
      });
    }
  };

  const fullCode = code.join("");

  if (!email) return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-10">
          <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center glow-primary">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <span className="text-lg font-semibold text-foreground tracking-tight">
            STRIVUS
          </span>
        </div>

        {state === "success" ? (
          <div className="text-center py-10">
            <div className="mx-auto h-16 w-16 rounded-full bg-success/10 border border-success/20 flex items-center justify-center mb-6 glow-success">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              You&apos;re in
            </h2>
            <p className="text-muted-foreground text-sm">
              Session active — you&apos;ll stay signed in for 2 weeks on this
              device.
            </p>
          </div>
        ) : state === "expired" ? (
          <div className="text-center py-10">
            <div className="mx-auto h-16 w-16 rounded-full bg-warning/10 border border-warning/20 flex items-center justify-center mb-6 glow-warning">
              <XCircle className="h-8 w-8 text-warning" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Code expired
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              That code is no longer valid. Request a new one below.
            </p>
            <Button
              onClick={() => {
                handleResend();
                setState("input");
                setCode(Array(6).fill(""));
              }}
              className="glow-primary"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Send new code
            </Button>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Enter verification code
            </h2>

            <p className="text-muted-foreground text-sm mb-1">
              We sent a 6-digit code to{" "}
              <span className="text-foreground font-medium font-data">
                {email}
              </span>
            </p>

            <Link
              href="/auth/login"
              className="text-primary text-sm hover:underline inline-flex items-center gap-1 mb-8"
            >
              <ArrowLeft className="h-3 w-3" />
              Use a different email
            </Link>

            <div className="flex gap-2.5 justify-center mb-6" onPaste={handlePaste}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className={`w-12 h-14 text-center text-xl font-data rounded-lg border bg-muted text-foreground outline-none transition-all ${
                    state === "invalid"
                      ? "border-destructive glow-destructive"
                      : "border-border focus:border-primary focus:glow-primary"
                  }`}
                  disabled={state === "verifying"}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            {state === "invalid" && (
              <p className="text-destructive text-sm text-center mb-4">
                Invalid code. Please try again.
              </p>
            )}

            <Button
              onClick={handleVerify}
              className="w-full h-11 glow-primary mb-4"
              disabled={fullCode.length < 6 || state === "verifying"}
            >
              {state === "verifying" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Verify & sign in"
              )}
            </Button>

            <div className="text-center">
              <button
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="text-sm text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
              >
                {resendCooldown > 0
                  ? `Resend code in ${resendCooldown}s`
                  : "Didn’t get a code? Resend"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
