"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

interface SplitBookDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSplit: (wordCount: number) => void
}

const WORD_COUNT_OPTIONS = [5000, 10000, 15000, 20000, 25000, 30000, 40000, 50000]
const STORAGE_KEY = "lastUsedWordCount"

export function SplitBookDialog({ isOpen, onOpenChange, onSplit }: SplitBookDialogProps) {
  const [wordCount, setWordCount] = useState(10000)

  useEffect(() => {
    const savedCount = localStorage.getItem(STORAGE_KEY)
    if (savedCount) {
      setWordCount(parseInt(savedCount, 10))
    }
  }, [])

  const handleWordCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (!isNaN(value) && value > 0) {
      setWordCount(value)
    }
  }

  const handleSplitClick = () => {
    localStorage.setItem(STORAGE_KEY, wordCount.toString())
    onSplit(wordCount)
    onOpenChange(false)
    toast.success(`Книга будет разделена на части по ${wordCount} символов`)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Разделить книгу</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Количество символов в части:</label>
            <Input
              type="number"
              value={wordCount}
              onChange={handleWordCountChange}
              min="1000"
              step="1000"
              className="w-full"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {WORD_COUNT_OPTIONS.map((count) => (
              <Button
                key={count}
                variant={wordCount === count ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setWordCount(count)
                  localStorage.setItem(STORAGE_KEY, count.toString())
                }}
              >
                {count.toLocaleString()}
              </Button>
            ))}
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
