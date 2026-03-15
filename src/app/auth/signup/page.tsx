"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, User, ArrowRight, Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function SignUp() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedName = fullName.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!trimmedName || !normalizedEmail) return;

    setLoading(true);
    setErrorMessage("");

    try {
      const signupRes = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: trimmedName,
          email: normalizedEmail,
        }),
      });

      let signupData: any = null;
      try {
        signupData = await signupRes.json();
      } catch {
        throw new Error(`Signup failed with status ${signupRes.status}`);
      }

      if (!signupRes.ok) {
        throw new Error(signupData.error || "Failed to create account");
      }

      const codeRes = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
        }),
      });

      let codeData: any = null;
      try {
        codeData = await codeRes.json();
      } catch {
        throw new Error(`Request-code failed with status ${codeRes.status}`);
      }

      if (!codeRes.ok) {
        throw new Error(codeData.error || "Failed to send verification code");
      }

      toast({
        title: "Verification code sent",
        description: `Check ${normalizedEmail} for your 6-digit code.`,
      });

      router.push(
        `/auth/verification?email=${encodeURIComponent(normalizedEmail)}`
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";

      console.error("Signup flow error:", error);
      setErrorMessage(message);

      toast({
        title: "Signup failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden items-center justify-center bg-card border-r border-border">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative z-10 px-16 max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center glow-primary">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground tracking-tight">
                STRIVUS
              </h1>
              <p className="text-xs text-muted-foreground tracking-widest uppercase">
                Kinetica Platform
              </p>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-foreground leading-tight mb-4">
            Create your
            <br />
            <span className="text-primary">dashboard account.</span>
          </h2>

          <p className="text-muted-foreground leading-relaxed">
            Get secure, passwordless access with a one-time email code. Elevated
            operational or clinical access is managed separately by your
            administrator.
          </p>

          <div className="mt-10 space-y-3">
            {[
              "Instant access with email codes",
              "Secure session-based sign-in",
              "Admin-managed elevated access",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 text-sm text-muted-foreground"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <span className="text-lg font-semibold text-foreground tracking-tight">
              STRIVUS
            </span>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-2">
            Create account
          </h2>
          <p className="text-muted-foreground text-sm mb-8">
            Set up your access. We&apos;ll send a verification code to confirm
            your email.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-label">Full name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Dr. Jane Smith"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10 h-11 bg-muted border-border focus:border-primary"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-label">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="jane@organization.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 bg-muted border-border focus:border-primary"
                  required
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Need operational or clinical access? Contact your administrator
              after creating your account.
            </p>

            {errorMessage && (
              <p className="text-sm text-destructive">{errorMessage}</p>
            )}

            <Button
              type="submit"
              className="w-full h-11 glow-primary"
              disabled={loading || !email.trim() || !fullName.trim()}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground text-center">
              Already have access?{" "}
              <Link
                href="/auth/login"
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>

          <p className="text-xs text-muted-foreground/60 text-center mt-6">
            By creating an account you agree to the platform terms and data
            policies.
          </p>
        </div>
      </div>
    </div>
  );
}
