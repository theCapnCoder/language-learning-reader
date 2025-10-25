"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

type Language = "en" | "de"

export function LanguageSwitcher() {
  const [currentLanguage, setCurrentLanguage] = useState<Language>("en")

  useEffect(() => {
    const savedLanguage = localStorage.getItem("currentLanguage") as Language | null
    setCurrentLanguage(savedLanguage || "en")
  }, [])

  const switchLanguage = (lang: Language) => {
    setCurrentLanguage(lang)
    localStorage.setItem("currentLanguage", lang)
  }

  return (
    <div className="flex items-center space-x-1">
      <button
        onClick={() => switchLanguage("en")}
        className={cn(
          "px-3 py-2 rounded-md text-sm font-medium transition-colors",
          currentLanguage === "en"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
      >
        EN
      </button>
      <span className="text-muted-foreground">/</span>
      <button
        onClick={() => switchLanguage("de")}
        className={cn(
          "px-3 py-2 rounded-md text-sm font-medium transition-colors",
          currentLanguage === "de"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
      >
        DE
      </button>
    </div>
  )
}
