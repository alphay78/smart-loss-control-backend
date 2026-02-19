"use client"

import { useState } from "react"
import { WelcomeScreen } from "./welcome-screen"
import { OwnerRegisterForm } from "./owner-register-form"
import { OtpVerification } from "./otp-verification"
import { StaffEntry } from "./staff-entry"
import { StaffPinLogin } from "./staff-pin-login"
import { StaffQrSetup } from "./staff-qr-setup"

type AuthStep =
  | "welcome"
  | "owner-register"
  | "otp-verify"
  | "staff-entry"
  | "staff-pin"
  | "staff-qr"

interface AuthFlowProps {
  onAuthComplete: () => void
}

export function AuthFlow({ onAuthComplete }: AuthFlowProps) {
  const [step, setStep] = useState<AuthStep>("welcome")
  const [phone, setPhone] = useState("")
  const [devOtp, setDevOtp] = useState<string | undefined>()

  function handleRoleSelect(role: "owner" | "staff") {
    if (role === "owner") {
      setStep("owner-register")
    } else {
      setStep("staff-entry")
    }
  }

  function handleRegistrationSuccess(registeredPhone: string, otp?: string) {
    setPhone(registeredPhone)
    setDevOtp(otp)
    setStep("otp-verify")
  }

  return (
    <main className="min-h-screen bg-background">
      {step === "welcome" && <WelcomeScreen onSelectRole={handleRoleSelect} />}

      {step === "owner-register" && (
        <OwnerRegisterForm
          onBack={() => setStep("welcome")}
          onSuccess={handleRegistrationSuccess}
        />
      )}

      {step === "otp-verify" && (
        <OtpVerification
          phone={phone}
          devOtp={devOtp}
          onBack={() => setStep("owner-register")}
          onSuccess={onAuthComplete}
        />
      )}

      {step === "staff-entry" && (
        <StaffEntry
          onBack={() => setStep("welcome")}
          onScanQR={() => setStep("staff-qr")}
          onPinLogin={() => setStep("staff-pin")}
        />
      )}

      {step === "staff-pin" && (
        <StaffPinLogin
          onBack={() => setStep("staff-entry")}
          onSuccess={onAuthComplete}
        />
      )}

      {step === "staff-qr" && (
        <StaffQrSetup
          onBack={() => setStep("staff-entry")}
          onSuccess={() => setStep("staff-pin")}
        />
      )}
    </main>
  )
}
