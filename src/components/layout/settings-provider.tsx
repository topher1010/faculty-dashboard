"use client"

import { createContext, useContext, useEffect, useState } from "react"

interface Settings {
  /** Per-account carry-forward: accountId -> true means use 25% carry-forward */
  carryForward: Record<string, boolean>
  /** Fixed dollar threshold for risk flagging (default $5,000) */
  riskDollarThreshold: number
}

const defaultSettings: Settings = {
  carryForward: {},
  riskDollarThreshold: 5000,
}

const SettingsContext = createContext<{
  settings: Settings
  updateSettings: (updates: Partial<Settings>) => void
}>({
  settings: defaultSettings,
  updateSettings: () => {},
})

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("dashboard-settings")
    if (saved) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) })
      } catch {
        // ignore malformed data
      }
    }
    setLoaded(true)
  }, [])

  const updateSettings = (updates: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates }
      localStorage.setItem("dashboard-settings", JSON.stringify(next))
      return next
    })
  }

  // Don't render children until settings are loaded from localStorage
  // to avoid a flash of default values
  if (!loaded) return null

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}

/** Helper: check if carry-forward is enabled for a specific account */
export function isCarryForwardEnabled(
  settings: Settings,
  accountId: string,
  dataDefault: boolean
): boolean {
  if (accountId in settings.carryForward) {
    return settings.carryForward[accountId]
  }
  return dataDefault
}
