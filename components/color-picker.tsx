"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Check } from "lucide-react"

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
}

const colorPresets = [
  { name: "Синий", value: "#3b82f6" },
  { name: "Зеленый", value: "#10b981" },
  { name: "Желтый", value: "#f59e0b" },
  { name: "Красный", value: "#ef4444" },
  { name: "Фиолетовый", value: "#8b5cf6" },
  { name: "Голубой", value: "#06b6d4" },
  { name: "Розовый", value: "#ec4899" },
  { name: "Оранжевый", value: "#f97316" },
]

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [customColor, setCustomColor] = useState(value)

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color)
    if (/^#[0-9A-F]{6}$/i.test(color)) {
      onChange(color)
    }
  }

  return (
    <div className="space-y-4">
      {/* Preset colors */}
      <div>
        <h4 className="text-sm font-medium mb-3">Готовые цвета</h4>
        <div className="grid grid-cols-4 gap-2">
          {colorPresets.map((preset) => (
            <button
              key={preset.value}
              className={`relative w-12 h-12 rounded-lg border-2 transition-all hover:scale-105 ${
                value === preset.value ? "border-foreground" : "border-border"
              }`}
              style={{ backgroundColor: preset.value }}
              onClick={() => onChange(preset.value)}
              title={preset.name}
            >
              {value === preset.value && <Check className="absolute inset-0 m-auto h-4 w-4 text-white" />}
            </button>
          ))}
        </div>
      </div>

      {/* Custom color */}
      <div>
        <h4 className="text-sm font-medium mb-3">Свой цвет</h4>
        <div className="flex gap-2">
          <div className="w-12 h-10 rounded border-2 border-border" style={{ backgroundColor: customColor }} />
          <Input
            type="text"
            placeholder="#3b82f6"
            value={customColor}
            onChange={(e) => handleCustomColorChange(e.target.value)}
            className="flex-1"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">Введите HEX код цвета (например: #3b82f6)</p>
      </div>
    </div>
  )
}
