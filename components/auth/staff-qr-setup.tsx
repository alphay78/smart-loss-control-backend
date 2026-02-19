"use client"

import { useState, type FormEvent } from "react"
import { ArrowLeft, Loader2, ScanLine, User, CheckCircle2 } from "lucide-react"
import { authApi } from "@/lib/api"
import { PinInput } from "./pin-input"

interface StaffQrSetupProps {
  onBack: () => void
  onSuccess: () => void
}

function generateDeviceId(): string {
  if (typeof window === "undefined") return ""
  const stored = localStorage.getItem("slc_device_id")
  if (stored) return stored
  const id = `web-${crypto.randomUUID()}`
  localStorage.setItem("slc_device_id", id)
  return id
}

export function StaffQrSetup({ onBack, onSuccess }: StaffQrSetupProps) {
  const [step, setStep] = useState<"scan" | "setup" | "done">("scan")
  const [qrToken, setQrToken] = useState("")
  const [staffName, setStaffName] = useState("")
  const [pin, setPin] = useState(["", "", "", ""])
  const [confirmPin, setConfirmPin] = useState(["", "", "", ""])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  function handleQrTokenSubmit(e: FormEvent) {
    e.preventDefault()
    if (qrToken.trim().length < 3) {
      setError("Please enter a valid QR code")
      return
    }
    setError("")
    setStep("setup")
  }

  async function handleSetup(e: FormEvent) {
    e.preventDefault()
    setError("")

    const pinCode = pin.join("")
    const confirmPinCode = confirmPin.join("")

    if (staffName.length < 2) {
      setError("Name must be at least 2 characters")
      return
    }

    if (pinCode.length < 4) {
      setError("Please enter a 4-digit PIN")
      return
    }

    if (pinCode !== confirmPinCode) {
      setError("PINs do not match")
      setConfirmPin(["", "", "", ""])
      return
    }

    setIsLoading(true)
    try {
      const result = await authApi.linkStaff({
        qr_token: qrToken.trim(),
        device_id: generateDeviceId(),
        staff_name: staffName,
        pin: pinCode,
      })

      if (result.success) {
        setStep("done")
        setTimeout(() => {
          onSuccess()
        }, 2000)
      }
    } catch (err: unknown) {
      const error = err as { message?: string }
      setError(error.message || "Failed to link device")
    } finally {
      setIsLoading(false)
    }
  }

  if (step === "done") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Setup Complete!</h2>
          <p className="text-sm text-muted-foreground text-center">
            Your device has been linked. You can now log in with your PIN.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col px-6 py-8">
      {/* Header */}
      <button
        onClick={step === "setup" ? () => setStep("scan") : onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors self-start"
        aria-label="Go back"
      >
        <ArrowLeft className="h-5 w-5" />
        <span className="text-sm font-medium">Back</span>
      </button>

      <div className="flex flex-1 flex-col items-center justify-center">
        {step === "scan" ? (
          <form
            onSubmit={handleQrTokenSubmit}
            className="w-full max-w-sm flex flex-col items-center gap-8"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
              <ScanLine className="h-10 w-10 text-primary" />
            </div>

            <div className="flex flex-col items-center gap-2 text-center">
              <h2 className="text-2xl font-bold text-foreground">
                Enter QR Code
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Ask your manager to share the QR code token from their app
              </p>
            </div>

            <div className="w-full flex flex-col gap-2">
              <label
                htmlFor="qrToken"
                className="text-sm font-medium text-foreground"
              >
                QR Code Token
              </label>
              <input
                id="qrToken"
                type="text"
                placeholder="Paste token from manager"
                value={qrToken}
                onChange={(e) => setQrToken(e.target.value)}
                className="w-full rounded-xl border-2 border-input bg-card py-4 px-4 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors font-mono text-sm"
                autoFocus
                required
              />
            </div>

            {error && (
              <div className="w-full rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-lg font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
            >
              Continue
            </button>
          </form>
        ) : (
          <form
            onSubmit={handleSetup}
            className="w-full max-w-sm flex flex-col gap-8"
          >
            <div className="flex flex-col gap-2 text-center">
              <h2 className="text-2xl font-bold text-foreground">
                Complete Your Setup
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Enter your name and create a 4-digit PIN
              </p>
            </div>

            <div className="flex flex-col gap-6">
              {/* Staff Name */}
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="setupStaffName"
                  className="text-sm font-medium text-foreground"
                >
                  Your Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="setupStaffName"
                    type="text"
                    placeholder="Chinedu"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    className="w-full rounded-xl border-2 border-input bg-card py-4 pl-12 pr-4 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                    autoFocus
                    required
                    minLength={2}
                    maxLength={150}
                  />
                </div>
              </div>

              {/* Create PIN */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground text-center">
                  Create 4-Digit PIN
                </label>
                <PinInput
                  value={pin}
                  onChange={setPin}
                  autoFocus={false}
                  label="Create PIN"
                />
              </div>

              {/* Confirm PIN */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground text-center">
                  Confirm PIN
                </label>
                <PinInput
                  value={confirmPin}
                  onChange={setConfirmPin}
                  label="Confirm PIN"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive text-center">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-lg font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Linking Device...
                </>
              ) : (
                "Complete Setup"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
