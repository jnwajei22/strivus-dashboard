"use client";

export function TopBar({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center border-b border-border bg-card/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <h1 className="text-lg font-semibold tracking-tight text-foreground">
        {title}
      </h1>
    </header>
  );
}