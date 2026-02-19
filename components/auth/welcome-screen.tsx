"use client"

import { ShieldCheck, Store, UserCheck } from "lucide-react"

interface WelcomeScreenProps {
  onSelectRole: (role: "owner" | "staff") => void
}

export function WelcomeScreen({ onSelectRole }: WelcomeScreenProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm flex flex-col items-center gap-10">
        {/* Logo and branding */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary">
            <ShieldCheck className="h-10 w-10 text-primary-foreground" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground text-balance text-center">
              Smart Loss Control
            </h1>
            <p className="text-base text-muted-foreground text-center text-pretty leading-relaxed">
              Protect your cooking oil business with smart inventory tracking
            </p>
          </div>
        </div>

        {/* Role selection buttons */}
        <div className="flex w-full flex-col gap-4">
          <button
            onClick={() => onSelectRole("owner")}
            className="flex w-full items-center gap-4 rounded-xl bg-primary px-6 py-5 text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/20">
              <Store className="h-6 w-6" />
            </div>
            <div className="flex flex-col items-start gap-0.5">
              <span className="text-lg font-semibold">Register My Shop</span>
              <span className="text-sm opacity-80">
                Shop owners start here
              </span>
            </div>
          </button>

          <button
            onClick={() => onSelectRole("staff")}
            className="flex w-full items-center gap-4 rounded-xl border-2 border-border bg-card px-6 py-5 text-card-foreground transition-all hover:bg-accent active:scale-[0.98]"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary">
              <UserCheck className="h-6 w-6 text-foreground" />
            </div>
            <div className="flex flex-col items-start gap-0.5">
              <span className="text-lg font-semibold">Staff Login</span>
              <span className="text-sm text-muted-foreground">
                Log in with your PIN
              </span>
            </div>
          </button>
        </div>

        {/* Footer */}
        <p className="text-xs text-muted-foreground text-center">
          Inventory management for cooking oil businesses
        </p>
      </div>
    </div>
  )
}
