"use client"

import { useState, type FormEvent } from "react"
import { ArrowLeft, Loader2, User, Store, Phone } from "lucide-react"
import { authApi } from "@/lib/api"

interface OwnerRegisterFormProps {
  onBack: () => void
  onSuccess: (phone: string, devOtp?: string) => void
}

export function OwnerRegisterForm({
  onBack,
  onSuccess,
}: OwnerRegisterFormProps) {
  const [fullName, setFullName] = useState("")
  const [shopName, setShopName] = useState("")
  const [phone, setPhone] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  function formatPhoneDisplay(value: string) {
    // Strip non-digits
    const digits = value.replace(/\D/g, "")

    // If it starts with 234, format with +234
    if (digits.startsWith("234")) {
      const rest = digits.slice(3)
      return `+234 ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6, 10)}`.trim()
    }

    // If it starts with 0, replace with +234
    if (digits.startsWith("0")) {
      const rest = digits.slice(1)
      return `+234 ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6, 10)}`.trim()
    }

    return value
  }

  function normalizePhone(value: string): string {
    const digits = value.replace(/\D/g, "")
    if (digits.startsWith("234")) return `+${digits}`
    if (digits.startsWith("0")) return `+234${digits.slice(1)}`
    return `+234${digits}`
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError("")

    if (fullName.length < 2) {
      setError("Full name must be at least 2 characters")
      return
    }
    if (shopName.length < 2) {
      setError("Shop name must be at least 2 characters")
      return
    }

    const normalizedPhone = normalizePhone(phone)
    if (normalizedPhone.length < 13) {
      setError("Please enter a valid Nigerian phone number")
      return
    }

    setIsLoading(true)
    try {
      const result = await authApi.registerOwner({
        full_name: fullName,
        shop_name: shopName,
        phone: normalizedPhone,
      })

      if (result.success) {
        onSuccess(normalizedPhone, result.dev_otp)
      }
    } catch (err: unknown) {
      const error = err as { message?: string; errors?: string[] }
      setError(
        error.errors?.join(", ") || error.message || "Registration failed"
      )
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
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-foreground">
              Register Your Shop
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Enter your details to get started with Smart Loss Control
            </p>
          </div>

          <div className="flex flex-col gap-5">
            {/* Full Name */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="fullName"
                className="text-sm font-medium text-foreground"
              >
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="fullName"
                  type="text"
                  placeholder="Amina Yusuf"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border-2 border-input bg-card py-4 pl-12 pr-4 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                  autoFocus
                  required
                  minLength={2}
                  maxLength={150}
                />
              </div>
            </div>

            {/* Shop Name */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="shopName"
                className="text-sm font-medium text-foreground"
              >
                Shop Name
              </label>
              <div className="relative">
                <Store className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="shopName"
                  type="text"
                  placeholder="Amina Ventures"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full rounded-xl border-2 border-input bg-card py-4 pl-12 pr-4 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                  required
                  minLength={2}
                  maxLength={150}
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="phone"
                className="text-sm font-medium text-foreground"
              >
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="phone"
                  type="tel"
                  placeholder="+234 801 234 5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onBlur={() => setPhone(formatPhoneDisplay(phone))}
                  className="w-full rounded-xl border-2 border-input bg-card py-4 pl-12 pr-4 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Nigerian phone number format (+234...)
              </p>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-lg font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Sending OTP...
              </>
            ) : (
              "Send OTP"
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
