"use client"

import { useState, useEffect } from "react"
import { TextSettings } from "@/components/text-settings"
import { LocalDB } from "@/lib/db"
import type { AppSettings } from "@/lib/db"
import { toast } from "react-toastify"

export default function TextSettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({
    highlightColor: "#3b82f6",
    groqApiKey: "",
    fontSize: 16,
    lineHeight: 1.6,
    letterSpacing: 0,
    wordSpacing: 0,
    paragraphSpacing: 16,
    textAlign: "left",
    fontFamily: "system-ui",
    translationIconSize: 24,
  })
  const [toastTimeout, setToastTimeout] = useState<NodeJS.Timeout | null>(null)
  // const { toast } = useToast() // Удалено, используем react-toastify

  useEffect(() => {
    const loadedSettings = LocalDB.getSettings()
    setSettings(loadedSettings)

    // Очистка таймаута при размонтировании
    return () => {
      if (toastTimeout) {
        clearTimeout(toastTimeout)
      }
    }
  }, [])

  const handleSettingsChange = (newSettings: AppSettings) => {
    setSettings(newSettings)
    LocalDB.saveSettings(newSettings)

    // Отменяем предыдущий таймаут если есть
    if (toastTimeout) {
      clearTimeout(toastTimeout)
    }

    // Устанавливаем новый таймаут с задержкой 1 секунда
    const newTimeout = setTimeout(() => {
      toast.success("Настройки сохранены", {
        position: "top-right",
        autoClose: 2000,
      })
    }, 1000)

    setToastTimeout(newTimeout)
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <TextSettings settings={settings} onSettingsChange={handleSettingsChange} />
    </div>
  )
}
