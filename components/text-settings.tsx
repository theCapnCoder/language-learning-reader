"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Type, ArrowLeft } from "lucide-react"
import type { AppSettings } from "@/lib/db"

interface TextSettingsProps {
  settings: AppSettings
  onSettingsChange: (settings: AppSettings) => void
}

const fontFamilies = [
  { value: "system-ui", label: "System UI" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: '"Times New Roman", serif', label: "Times New Roman" },
  { value: "Arial, sans-serif", label: "Arial" },
  { value: '"Helvetica Neue", sans-serif', label: "Helvetica" },
  { value: '"Courier New", monospace', label: "Courier New" },
  { value: "Verdana, sans-serif", label: "Verdana" },
  { value: '"Trebuchet MS", sans-serif', label: "Trebuchet MS" },
]

// Компонент для управления параметром с плюс/минус кнопками
const ControlWithButtons = ({
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit = "",
  formatValue = (v: number) => v.toString(),
}: {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step: number
  unit?: string
  formatValue?: (value: number) => string
}) => {
  const handleDecrease = () => {
    const newValue = Math.max(min, value - step)
    onChange(newValue)
  }

  const handleIncrease = () => {
    const newValue = Math.min(max, value + step)
    onChange(newValue)
  }

  const progress = ((value - min) / (max - min)) * 100

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-sm font-medium text-muted-foreground">
          {formatValue(value)}
          {unit}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={handleDecrease}
          disabled={value <= min}
        >
          -
        </Button>
        <div className="flex-1 relative">
          <div className="w-full h-2 bg-muted rounded-full">
            <div
              className="h-2 bg-primary rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={handleIncrease}
          disabled={value >= max}
        >
          +
        </Button>
      </div>
    </div>
  )
}

const textAlignOptions = [
  { value: "left", label: "По левому краю" },
  { value: "center", label: "По центру" },
  { value: "right", label: "По правому краю" },
  { value: "justify", label: "По ширине" },
]

export function TextSettings({ settings, onSettingsChange }: TextSettingsProps) {
  const handleBack = () => {
    window.history.back()
  }

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value })
  }

  const getTextStyle = () => ({
    fontSize: `${settings?.fontSize || 16}px`,
    lineHeight: settings?.lineHeight || 1.6,
    letterSpacing: `${settings?.letterSpacing || 0}px`,
    wordSpacing: `${settings?.wordSpacing || 0}px`,
    textAlign: settings?.textAlign || "left",
    fontFamily: settings?.fontFamily || "system-ui",
  })

  const getParagraphStyle = () => ({
    marginBottom: `${settings?.paragraphSpacing || 16}px`,
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Настройки текста</h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="h-10 w-10 rounded-full p-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="p-6 border rounded-lg bg-muted/50 min-h-[200px]">
            <div style={getTextStyle()}>
              <h3 className="text-2xl font-bold mb-4" style={getParagraphStyle()}>
                Образец заголовка
              </h3>
              <p style={getParagraphStyle()}>
                Это пример текста для предпросмотра. Здесь вы можете увидеть, как будет выглядеть
                текст при чтении с выбранными настройками. Межстрочный интервал, отступы и другие
                параметры влияют на комфорт чтения.
              </p>
              <p style={getParagraphStyle()}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
                exercitation ullamco laboris.
              </p>
              <p style={getParagraphStyle()}>
                Настройки текста позволяют персонализировать опыт чтения под ваши предпочтения.
                Экспериментируйте с разными параметрами, чтобы найти оптимальные значения для
                комфортного чтения.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Font Size */}
          <ControlWithButtons
            label="Размер шрифта"
            value={settings?.fontSize || 16}
            onChange={(value) => updateSetting("fontSize", value)}
            min={12}
            max={32}
            step={1}
            unit="px"
          />

          {/* Line Height */}
          <ControlWithButtons
            label="Межстрочный интервал"
            value={settings?.lineHeight || 1.6}
            onChange={(value) => updateSetting("lineHeight", value)}
            min={1.0}
            max={3.0}
            step={0.1}
            formatValue={(value) => value.toFixed(1)}
          />

          {/* Letter Spacing */}
          <ControlWithButtons
            label="Межбуквенный интервал"
            value={settings?.letterSpacing || 0}
            onChange={(value) => updateSetting("letterSpacing", value)}
            min={-2}
            max={5}
            step={0.5}
            unit="px"
          />

          {/* Word Spacing */}
          <ControlWithButtons
            label="Межсловный интервал"
            value={settings?.wordSpacing || 0}
            onChange={(value) => updateSetting("wordSpacing", value)}
            min={0}
            max={10}
            step={1}
            unit="px"
          />

          {/* Paragraph Spacing */}
          <ControlWithButtons
            label="Отступ между абзацами"
            value={settings?.paragraphSpacing || 16}
            onChange={(value) => updateSetting("paragraphSpacing", value)}
            min={0}
            max={32}
            step={2}
            unit="px"
          />

          {/* Translation Icon Size */}
          <ControlWithButtons
            label="Размер иконки перевода"
            value={settings?.translationIconSize || 24}
            onChange={(value) => updateSetting("translationIconSize", value)}
            min={16}
            max={32}
            step={2}
            unit="px"
          />

          {/* Font Family */}
          <div className="space-y-2">
            <Label>Шрифт</Label>
            <Select
              value={settings?.fontFamily || "system-ui"}
              onValueChange={(value) => updateSetting("fontFamily", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите шрифт" />
              </SelectTrigger>
              <SelectContent>
                {fontFamilies.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Text Align */}
          <div className="space-y-2">
            <Label>Выравнивание текста</Label>
            <Select
              value={settings?.textAlign || "left"}
              onValueChange={(value) => updateSetting("textAlign", value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите выравнивание" />
              </SelectTrigger>
              <SelectContent>
                {textAlignOptions.map((align) => (
                  <SelectItem key={align.value} value={align.value}>
                    {align.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quick Presets */}
          <div className="space-y-3">
            <Label>Быстрые настройки</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateSetting("fontSize", 14)}
                className={(settings?.fontSize || 16) === 14 ? "border-primary" : ""}
              >
                Маленький
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateSetting("fontSize", 18)}
                className={(settings?.fontSize || 16) === 18 ? "border-primary" : ""}
              >
                Средний
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateSetting("fontSize", 24)}
                className={(settings?.fontSize || 16) === 24 ? "border-primary" : ""}
              >
                Большой
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateSetting("fontSize", 28)}
                className={(settings?.fontSize || 16) === 28 ? "border-primary" : ""}
              >
                Огромный
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
