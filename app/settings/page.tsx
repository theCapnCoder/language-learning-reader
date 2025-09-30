"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ColorPicker } from "@/components/color-picker"
import { Settings, Key, Palette, Save, Eye, EyeOff } from "lucide-react"
import { LocalDB } from "@/lib/db"
import type { AppSettings, Book, DictionaryWord } from "@/lib/db"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({ highlightColor: "#3b82f6", groqApiKey: "" })
  const [books, setBooks] = useState<Book[]>([])
  const [words, setWords] = useState<DictionaryWord[]>([])
  const [showApiKey, setShowApiKey] = useState(false)
  const [tempApiKey, setTempApiKey] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    const loadedSettings = LocalDB.getSettings()
    const loadedBooks = LocalDB.getBooks()
    const loadedWords = LocalDB.getDictionary()

    setSettings(loadedSettings)
    setBooks(loadedBooks)
    setWords(loadedWords)
    setTempApiKey(loadedSettings.groqApiKey)
  }, [])

  const handleSaveSettings = () => {
    const updatedSettings = {
      ...settings,
      groqApiKey: tempApiKey,
    }

    LocalDB.saveSettings(updatedSettings)
    setSettings(updatedSettings)

    toast({
      title: "Настройки сохранены",
      description: "Все изменения были успешно сохранены",
    })
  }

  const handleColorChange = (color: string) => {
    setSettings((prev) => ({ ...prev, highlightColor: color }))
  }

  const handleClearData = () => {
    if (confirm("Вы уверены, что хотите очистить все данные? Это действие нельзя отменить.")) {
      localStorage.clear()
      setBooks([])
      setWords([])
      setSettings({ highlightColor: "#3b82f6", groqApiKey: "" })
      setTempApiKey("")

      toast({
        title: "Данные очищены",
        description: "Все книги, словарь и настройки были удалены",
      })
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-balance">Настройки</h1>
        <p className="text-muted-foreground mt-1">Настройте приложение под свои предпочтения</p>
      </div>

      {/* API Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            <h2 className="text-xl font-semibold">API настройки</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="groq-api-key">Groq API ключ</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="groq-api-key"
                  type={showApiKey ? "text" : "password"}
                  placeholder="Введите ваш Groq API ключ..."
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-8 w-8 p-0"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Получите бесплатный API ключ на{" "}
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                console.groq.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Внешний вид</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Цвет выделения изученных слов</Label>
            <ColorPicker value={settings.highlightColor} onChange={handleColorChange} />
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">
                Пример:{" "}
                <span className="font-medium" style={{ color: settings.highlightColor }}>
                  изученное слово
                </span>{" "}
                будет выделено таким цветом при чтении
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Управление данными</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleSaveSettings} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Сохранить настройки
            </Button>
            <Button variant="destructive" onClick={handleClearData}>
              Очистить все данные
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Все данные хранятся локально в вашем браузере. Очистка данных удалит все книги, словарь и настройки.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
