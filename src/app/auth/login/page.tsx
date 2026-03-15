"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, ArrowRight, Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [rememberDevice, setRememberDevice] = useState(true);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send login code");
      }

      toast({
        title: "Login code sent",
        description: `A 6-digit code has been sent to ${email}`,
      });

      router.push(`/auth/verification?email=${encodeURIComponent(email.trim().toLowerCase())}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to send login code";

      toast({
        title: "Request failed",
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
                Kinetica Dashboard
              </p>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-foreground leading-tight mb-4">
            Clinical Device Management,
            <br />
            <span className="text-primary">Reimagined.</span>
          </h2>

          <p className="text-muted-foreground leading-relaxed">
            Secure passwordless access to your device fleet, patient data,
            firmware operations, and system diagnostics — all from one console.
          </p>

          <div className="mt-10 space-y-3">
            {[
              "Role-based access control",
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

          <h2 className="text-2xl font-bold text-foreground mb-2">Sign in</h2>
          <p className="text-muted-foreground text-sm mb-8">
            Enter your email and we&apos;ll send a secure login code — no
            password needed.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-label">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="you@organization.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 bg-muted border-border focus:border-primary"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={rememberDevice}
                onCheckedChange={(checked) => setRememberDevice(checked === true)}
              />
              <label
                htmlFor="remember"
                className="text-sm text-muted-foreground cursor-pointer select-none"
              >
                Remember this device for 2 weeks
              </label>
            </div>

            <Button
              type="submit"
              className="w-full h-11 glow-primary"
              disabled={loading || !email.trim()}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Send login code
                  <ArrowRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground text-center">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/signup"
                className="text-primary hover:underline font-medium"
              >
                Sign Up
              </Link>
            </p>
          </div>

          <p className="text-xs text-muted-foreground/60 text-center mt-6">
            Protected by end-to-end encryption. Your data never leaves the
            platform.
          </p>
        </div>
      </div>
    </div>
  );
}