"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

interface SplitBookDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSplit: (charCount: number) => void
  bookLength: number // Общее количество символов в книге
}

const CHAR_COUNT_OPTIONS = [5000, 10000, 15000, 20000, 25000, 30000, 40000, 50000]
const STORAGE_KEY = "lastUsedCharCount"

export function SplitBookDialog({
  isOpen,
  onOpenChange,
  onSplit,
  bookLength,
}: SplitBookDialogProps) {
  const [charCount, setCharCount] = useState(10000)

  useEffect(() => {
    const savedCount = localStorage.getItem(STORAGE_KEY)
    if (savedCount) {
      setCharCount(parseInt(savedCount, 10))
    }
  }, [])

  const handleCharCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (!isNaN(value) && value > 0) {
      setCharCount(value)
    }
  }

  const handleSplitClick = () => {
    localStorage.setItem(STORAGE_KEY, charCount.toString())
    onSplit(charCount)
    onOpenChange(false)
    toast.success(`Книга будет разделена на части по ${charCount.toLocaleString()} символов`)
  }

  // Функция для расчета количества частей
  const calculateParts = (chars: number) => {
    return Math.ceil(bookLength / chars)
  }

  // Функция для склонения слова "часть"
  const getPartsWord = (count: number) => {
    const lastDigit = count % 10
    const lastTwoDigits = count % 100

    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
      return "частей"
    }
    if (lastDigit === 1) {
      return "часть"
    }
    if (lastDigit >= 2 && lastDigit <= 4) {
      return "части"
    }
    return "частей"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Разделить книгу</DialogTitle>
          <DialogDescription>Выберите количество символов для разделения книги</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Количество символов в части:</label>
            <Input
              type="number"
              value={charCount}
              onChange={handleCharCountChange}
              min="1000"
              step="1000"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Варианты разделения:</p>
            <div className="grid grid-cols-2 gap-2">
              {CHAR_COUNT_OPTIONS.map((count) => {
                const parts = calculateParts(count)
                const partsWord = getPartsWord(parts)

                return (
                  <Button
                    key={count}
                    variant={charCount === count ? "default" : "outline"}
                    className="justify-between"
                    onClick={() => {
                      setCharCount(count)
                      localStorage.setItem(STORAGE_KEY, count.toString())
                    }}
                  >
                    <span>{count.toLocaleString()} симв.</span>
                    <span className="ml-2 text-muted-foreground">
                      {parts} {partsWord}
                    </span>
                  </Button>
                )
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button onClick={handleSplitClick}>Разделить</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
