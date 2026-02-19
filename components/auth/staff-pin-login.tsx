"use client"

import { useState, type FormEvent } from "react"
import { ArrowLeft, Loader2, User } from "lucide-react"
import { authApi } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { PinInput } from "./pin-input"

interface StaffPinLoginProps {
  onBack: () => void
  onSuccess: () => void
}

export function StaffPinLogin({ onBack, onSuccess }: StaffPinLoginProps) {
  const { login } = useAuth()
  const [staffName, setStaffName] = useState("")
  const [pin, setPin] = useState(["", "", "", ""])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError("")

    const pinCode = pin.join("")

    if (staffName.length < 2) {
      setError("Please enter your name")
      return
    }

    if (pinCode.length < 4) {
      setError("Please enter your 4-digit PIN")
      return
    }

    setIsLoading(true)
    try {
      const result = await authApi.loginWithPIN({
        staff_name: staffName,
        pin: pinCode,
      })

      if (result.success && result.token && result.user) {
        login(result.token, result.user)
        onSuccess()
      }
    } catch (err: unknown) {
      const error = err as { message?: string }
      setError(error.message || "Invalid name or PIN")
      setPin(["", "", "", ""])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col px-6 py-8">
      {/* Header */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors self-start"
        aria-label="Go back"
      >
        <ArrowLeft className="h-5 w-5" />
        <span className="text-sm font-medium">Back</span>
      </button>

      <div className="flex flex-1 flex-col items-center justify-center">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm flex flex-col gap-8"
        >
          <div className="flex flex-col gap-2 text-center">
            <h2 className="text-2xl font-bold text-foreground">Staff Login</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Enter your name and PIN to log in
            </p>
          </div>

          <div className="flex flex-col gap-6">
            {/* Staff Name */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="staffName"
                className="text-sm font-medium text-foreground"
              >
                Your Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="staffName"
                  type="text"
                  placeholder="Chinedu"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="w-full rounded-xl border-2 border-input bg-card py-4 pl-12 pr-4 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                  autoFocus
                  required
                  minLength={2}
                />
              </div>
            </div>

            {/* PIN */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground text-center">
                Enter Your PIN
              </label>
              <PinInput value={pin} onChange={setPin} label="Login PIN" />
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
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
