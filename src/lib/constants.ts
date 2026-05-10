export const FRINGE_RATE = 0.40

export const AREA_COLORS = {
  "Research Lab": {
    primary: "#14B8A6",
    light: "#5EEAD4",
    bg: "bg-teal-50 dark:bg-teal-950/30",
    text: "text-teal-700 dark:text-teal-300",
    badge: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
    chart: ["#14B8A6", "#2DD4BF", "#5EEAD4", "#99F6E4"],
  },
  "Research Core": {
    primary: "#F59E0B",
    light: "#FCD34D",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-700 dark:text-amber-300",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    chart: ["#F59E0B", "#FBBF24", "#FCD34D"],
  },
} as const

export const STATUS_COLORS = {
  onTrack: "#059669",
  warning: "#D97706",
  danger: "#DC2626",
} as const

export const TRACKING_STYLE = {
  bg: "bg-gray-50 dark:bg-gray-900/50",
  text: "text-gray-500 dark:text-gray-400",
  badge: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
} as const

export const CATEGORY_COLORS: Record<string, string> = {
  "Salary": "#3B82F6",
  "Fringe": "#8B5CF6",
  "Supplies": "#10B981",
  "Equipment": "#F59E0B",
  "Travel": "#EF4444",
  "Animal Costs": "#EC4899",
  "Other": "#6B7280",
}

export type AreaName = keyof typeof AREA_COLORS
