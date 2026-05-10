import type { Metadata } from "next"
import "./globals.css"
import { ClientLayout } from "./client-layout"

export const metadata: Metadata = {
  title: "Faculty Budget Dashboard",
  description:
    "Financial dashboard for faculty research PIs — track budgets, burn rates, and personnel funding across research lab and core accounts.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
