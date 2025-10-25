"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Book, BookOpen, Settings, Library } from "lucide-react"
import { LanguageSwitcher } from "./LanguageSwitcher"

const navigationItems = [
  {
    name: "Мои книги",
    href: "/",
    icon: Library,
  },
  {
    name: "Словарь",
    href: "/dictionary",
    icon: Book,
  },
  {
    name: "Настройки",
    href: "/settings",
    icon: Settings,
  },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="border-b border-border bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Language Reader</h1>
          </div>

          <div className="flex space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>
          <LanguageSwitcher />
        </div>
      </div>
    </nav>
  )
}
