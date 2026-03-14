"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, User, ArrowRight, Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function SignUp() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim() || !fullName.trim()) return;

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setLoading(false);

    toast({
      title: "Verification code sent",
      description: `Check ${email} for your 6-digit code.`,
    });

    router.push(`/auth/verification?email=${encodeURIComponent(email)}`);
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
            Join the
            <br />
            <span className="text-primary">Operations Console.</span>
          </h2>

          <p className="text-muted-foreground leading-relaxed">
            Get secure, passwordless access to clinical device management,
            firmware operations, and patient data — assigned to your role.
          </p>

          <div className="mt-10 space-y-3">
            {[
              "Instant access with email codes",
              "Role-assigned permissions",
              "Full audit trail from day one",
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

            <div className="space-y-2">
              <label className="text-label">Requested role</label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="h-11 bg-muted border-border">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clinician">
                    Clinician / Provider
                  </SelectItem>
                  <SelectItem value="operations">
                    Operations / Support
                  </SelectItem>
                  <SelectItem value="viewer">Viewer / Read-only</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                An admin will confirm your role after signup.
              </p>
            </div>

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