"use client"

import { useAuth } from "@/lib/auth-context"
import { ShieldCheck, LogOut, Package, TrendingUp, AlertTriangle } from "lucide-react"

export function DashboardShell() {
  const { user, logout } = useAuth()

  const isOwner = user?.role === "OWNER"

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <ShieldCheck className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">
              Smart Loss Control
            </h1>
            <p className="text-xs text-muted-foreground">
              {isOwner ? "Owner Dashboard" : "Staff Dashboard"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {user?.full_name || user?.phone}
          </span>
          <button
            onClick={logout}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Dashboard content */}
      <main className="px-6 py-8">
        <div className="mx-auto max-w-2xl">
          <div className="flex flex-col gap-2 mb-8">
            <h2 className="text-xl font-bold text-foreground">
              Welcome back{user?.full_name ? `, ${user.full_name}` : ""}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isOwner
                ? "Manage your shop inventory and staff"
                : "Log sales and check inventory"}
            </p>
          </div>

          {/* Quick actions grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-border bg-card p-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-medium text-card-foreground">
                Inventory
              </span>
            </div>

            <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-border bg-card p-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-medium text-card-foreground">
                Sales
              </span>
            </div>

            {isOwner && (
              <>
                <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-border bg-card p-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                  </div>
                  <span className="text-sm font-medium text-card-foreground">
                    Alerts
                  </span>
                </div>

                <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-border bg-card p-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
                    <ShieldCheck className="h-6 w-6 text-foreground" />
                  </div>
                  <span className="text-sm font-medium text-card-foreground">
                    Staff
                  </span>
                </div>
              </>
            )}
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Dashboard features coming soon
          </p>
        </div>
      </main>
    </div>
  )
}
