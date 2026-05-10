"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useTheme } from "./theme-provider"
import {
  LayoutDashboard,
  FlaskConical,
  Microscope,
  Users,
  Settings,
  Sun,
  Moon,
  DollarSign,
  Menu,
  X,
} from "lucide-react"

const navItems = [
  {
    label: "Overview",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Research Lab",
    href: "/area/research-lab",
    icon: FlaskConical,
  },
  {
    label: "Research Core",
    href: "/area/research-core",
    icon: Microscope,
  },
  {
    label: "Personnel",
    href: "/personnel",
    icon: Users,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { theme, toggle } = useTheme()
  const [open, setOpen] = useState(false)

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  return (
    <>
      {/* Mobile header bar */}
      <div className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center gap-3 border-b bg-sidebar px-4 lg:hidden">
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg p-1.5 transition-colors hover:bg-sidebar-accent"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <DollarSign className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-bold">Budget Dashboard</span>
        </div>
      </div>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-56 flex-col border-r bg-sidebar transition-transform duration-200",
          "lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <DollarSign className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight">Budget</h1>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Faculty Dashboard
              </p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-1 transition-colors hover:bg-sidebar-accent lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Navigation
          </p>
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Theme toggle */}
        <div className="border-t p-3">
          <button
            onClick={toggle}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50"
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
            {theme === "light" ? "Dark Mode" : "Light Mode"}
          </button>
        </div>
      </aside>
    </>
  )
}
