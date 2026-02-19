"use client"

import { ArrowLeft, ScanLine, KeyRound } from "lucide-react"

interface StaffEntryProps {
  onBack: () => void
  onScanQR: () => void
  onPinLogin: () => void
}

export function StaffEntry({ onBack, onScanQR, onPinLogin }: StaffEntryProps) {
  return (
    <div className="flex min-h-screen flex-col px-6 py-8">
      {/* Header */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors self-start"
        aria-label="Go back to welcome"
      >
        <ArrowLeft className="h-5 w-5" />
        <span className="text-sm font-medium">Back to Welcome</span>
      </button>

      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="w-full max-w-sm flex flex-col items-center gap-10">
          <div className="flex flex-col items-center gap-2 text-center">
            <h2 className="text-2xl font-bold text-foreground">Staff Login</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Choose how you want to sign in
            </p>
          </div>

          <div className="flex w-full flex-col gap-4">
            {/* QR Code scan - first time setup */}
            <button
              onClick={onScanQR}
              className="flex w-full items-center gap-4 rounded-xl bg-primary px-6 py-5 text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/20">
                <ScanLine className="h-6 w-6" />
              </div>
              <div className="flex flex-col items-start gap-0.5">
                <span className="text-lg font-semibold">Scan QR Code</span>
                <span className="text-sm opacity-80">First time setup</span>
              </div>
            </button>

            {/* PIN Login - returning staff */}
            <button
              onClick={onPinLogin}
              className="flex w-full items-center gap-4 rounded-xl border-2 border-border bg-card px-6 py-5 text-card-foreground transition-all hover:bg-accent active:scale-[0.98]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary">
                <KeyRound className="h-6 w-6 text-foreground" />
              </div>
              <div className="flex flex-col items-start gap-0.5">
                <span className="text-lg font-semibold">Login with PIN</span>
                <span className="text-sm text-muted-foreground">
                  Returning staff
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
