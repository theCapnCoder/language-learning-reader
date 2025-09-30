"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Type, Palette, Settings, Sun, Moon } from "lucide-react"

interface ReadingControlsProps {
  fontSize: number
  onFontSizeChange: (size: number) => void
  highlightColor: string
  onHighlightColorChange: (color: string) => void
  isDarkMode: boolean
  onDarkModeToggle: () => void
}

const colorPresets = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
]

export function ReadingControls({
  fontSize,
  onFontSizeChange,
  highlightColor,
  onHighlightColorChange,
  isDarkMode,
  onDarkModeToggle,
}: ReadingControlsProps) {
  const [showControls, setShowControls] = useState(false)

  return (
    <>
      {/* Control toggle button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 right-4 z-40 bg-transparent"
        onClick={() => setShowControls(!showControls)}
      >
        <Settings className="h-4 w-4" />
      </Button>

      {/* Controls panel */}
      {showControls && (
        <Card className="fixed top-16 right-4 w-80 z-50 shadow-lg">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Настройки чтения</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowControls(false)}>
                ×
              </Button>
            </div>

            {/* Font size */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                <span className="text-sm font-medium">Размер шрифта</span>
              </div>
              <Slider
                value={[fontSize]}
                onValueChange={(value) => onFontSizeChange(value[0])}
                min={12}
                max={24}
                step={1}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground text-center">{fontSize}px</div>
            </div>

            {/* Highlight color */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                <span className="text-sm font-medium">Цвет выделения</span>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {colorPresets.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      highlightColor === color ? "border-foreground scale-110" : "border-border hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => onHighlightColorChange(color)}
                  />
                ))}
              </div>
            </div>

            {/* Dark mode toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                <span className="text-sm font-medium">Темная тема</span>
              </div>
              <Button variant="outline" size="sm" onClick={onDarkModeToggle}>
                {isDarkMode ? "Выкл" : "Вкл"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
