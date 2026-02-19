"use client"

import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from "react"
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react"
import { authApi } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

interface OtpVerificationProps {
  phone: string
  devOtp?: string
  onBack: () => void
  onSuccess: () => void
}

export function OtpVerification({
  phone,
  devOtp,
  onBack,
  onSuccess,
}: OtpVerificationProps) {
  const { login } = useAuth()
  const [otp, setOtp] = useState(["", "", "", ""])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [resendCooldown, setResendCooldown] = useState(60)
  const [isVerified, setIsVerified] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleVerify = useCallback(
    async (otpCode: string) => {
      setIsLoading(true)
      setError("")

      try {
        const result = await authApi.verifyOTP({
          phone,
          otp: otpCode,
        })

        if (result.success && result.token && result.user) {
          setIsVerified(true)
          login(result.token, result.user)
          // Brief delay to show success state
          setTimeout(() => {
            onSuccess()
          }, 1000)
        }
      } catch (err: unknown) {
        const error = err as { message?: string }
        setError(error.message || "Invalid or expired OTP")
        setOtp(["", "", "", ""])
        inputRefs.current[0]?.focus()
      } finally {
        setIsLoading(false)
      }
    },
    [phone, login, onSuccess]
  )

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1) // Only take last digit

    setOtp(newOtp)
    setError("")

    // Auto-advance to next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all 4 digits entered
    const fullOtp = newOtp.join("")
    if (fullOtp.length === 4) {
      handleVerify(fullOtp)
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4)
    if (pastedData.length === 4) {
      const newOtp = pastedData.split("")
      setOtp(newOtp)
      inputRefs.current[3]?.focus()
      handleVerify(pastedData)
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return
    setResendCooldown(60)
    setError("")

    try {
      await authApi.registerOwner({
        full_name: "",
        shop_name: "",
        phone,
      })
    } catch {
      // Existing user resend - this is expected to work
    }
  }

  // Mask phone for display
  const maskedPhone = phone.slice(0, 7) + "****" + phone.slice(-2)

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
        <div className="w-full max-w-sm flex flex-col items-center gap-8">
          {isVerified ? (
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-10 w-10 text-primary" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <h2 className="text-2xl font-bold text-foreground">
                  Verified!
                </h2>
                <p className="text-sm text-muted-foreground">
                  Redirecting to your dashboard...
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center gap-2 text-center">
                <h2 className="text-2xl font-bold text-foreground">
                  Verify Your Phone
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We sent a 4-digit code to{" "}
                  <span className="font-medium text-foreground">
                    {maskedPhone}
                  </span>
                </p>
              </div>

              {/* Dev OTP hint */}
              {devOtp && (
                <div className="w-full rounded-lg bg-warning/10 border border-warning/30 px-4 py-3 text-sm text-foreground text-center">
                  <span className="font-medium">Dev mode OTP:</span> {devOtp}
                </div>
              )}

              {/* OTP Input boxes */}
              <div className="flex gap-4" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="h-16 w-16 rounded-xl border-2 border-input bg-card text-center text-2xl font-bold text-foreground focus:border-primary focus:outline-none transition-colors"
                    aria-label={`Digit ${index + 1}`}
                  />
                ))}
              </div>

              {/* Error */}
              {error && (
                <div className="w-full rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive text-center">
                  {error}
                </div>
              )}

              {/* Resend */}
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  {"Didn't receive the code?"}
                </p>
                <button
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                  className="text-sm font-medium text-primary hover:underline disabled:text-muted-foreground disabled:no-underline disabled:cursor-not-allowed"
                >
                  {resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : "Resend OTP"}
                </button>
              </div>

              {/* Verify button */}
              <button
                onClick={() => handleVerify(otp.join(""))}
                disabled={isLoading || otp.join("").length < 4}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-lg font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Continue"
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
