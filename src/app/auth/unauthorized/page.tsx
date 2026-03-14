"use client";

import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Unauthorized() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-6 glow-destructive">
          <ShieldAlert className="h-8 w-8 text-destructive" />
        </div>

        <h2 className="text-2xl font-bold text-foreground mb-2">
          Insufficient permissions
        </h2>

        <p className="text-muted-foreground text-sm mb-8">
          Your current role does not have access to this area. Contact your
          administrator to request elevated permissions.
        </p>

        <div className="flex flex-col gap-3">
          <Button asChild className="glow-primary">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to dashboard
            </Link>
          </Button>

          <Button variant="ghost" asChild>
            <Link href="/auth/login">Sign in with a different account</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}