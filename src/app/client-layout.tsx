"use client"

import { ThemeProvider } from "@/components/layout/theme-provider"
import { SettingsProvider } from "@/components/layout/settings-provider"
import { Sidebar } from "@/components/layout/sidebar"

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 px-4 pb-4 pt-18 lg:ml-56 lg:px-6 lg:pb-6 lg:pt-6">{children}</main>
        </div>
      </SettingsProvider>
    </ThemeProvider>
  )
}
