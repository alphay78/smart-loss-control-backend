"use client"

import { useAuth } from "@/lib/auth-context"
import { AuthFlow } from "@/components/auth/auth-flow"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

export default function Home() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return <DashboardShell />
  }

  return <AuthFlow onAuthComplete={() => window.location.reload()} />
}
