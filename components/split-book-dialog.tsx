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
import { LocalDB, TextAnalyzer } from "@/lib/db"

interface SplitBookDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSplit: (charCount: number) => void
  book: {
    id: string
    title: string
    content: string
    fileName: string
    charCount: number
  }
  bookLength: number // Общее количество символов в книге
}

const CHAR_COUNT_OPTIONS = [5000, 10000, 15000, 20000, 25000, 30000, 40000, 50000]
const STORAGE_KEY = "lastUsedCharCount"

export function SplitBookDialog({
  isOpen,
  onOpenChange,
  onSplit,
  book,
  bookLength,
}: SplitBookDialogProps) {
  const [charCount, setCharCount] = useState(10000)
  const [isSplitting, setIsSplitting] = useState(false)

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

  const handleSplitClick = async () => {
    if (isSplitting) return

    setIsSplitting(true)
    try {
      // Get dictionary of known words
      const dictionary = LocalDB.getDictionary()
      const knownWords = new Set(
        dictionary.filter((w) => w.isKnown).map((w) => w.word.toLowerCase())
      )

      // Create a new folder for the split book
      const folderName = `@${book.title.substring(0, 27)}${book.title.length > 27 ? "..." : ""}`
      const newFolder = {
        id: Date.now().toString(),
        name: folderName,
        createdDate: new Date(),
      }

      // Save the new folder
      const folders = LocalDB.getFolders()
      LocalDB.saveFolders([...folders, newFolder])

      // Split the book content into parts
      const parts = []
      let startIndex = 0
      const content = book.content

      while (startIndex < content.length) {
        let endIndex = Math.min(startIndex + charCount, content.length)

        // Try to find a good breaking point
        if (endIndex < content.length) {
          // Look for paragraph break first
          let paragraphBreak = content.lastIndexOf("\n\n", endIndex)
          if (paragraphBreak > startIndex + charCount * 0.5) {
            endIndex = paragraphBreak + 2
          } else {
            // Then try sentence end
            const sentenceEnd = Math.max(
              content.lastIndexOf(". ", endIndex),
              content.lastIndexOf("! ", endIndex),
              content.lastIndexOf("? ", endIndex)
            )
            if (sentenceEnd > startIndex + charCount * 0.7) {
              endIndex = sentenceEnd + 1
            }
          }
        }

        const partContent = content.substring(startIndex, endIndex).trim()
        if (partContent) {
          parts.push(partContent)
        }
        startIndex = endIndex
      }

      // Create book entries for each part with word analysis
      const newBooks = parts.map((part, index) => {
        // Analyze the part to get word counts and difficulty
        const analysis = TextAnalyzer.analyzeBookDifficulty(part, knownWords)

        return {
          id: Date.now().toString(),
          title: `${book.title} (${index + 1}/${parts.length})`,
          content: part,
          fileName: `${book.fileName.replace(/\.[^/.]+$/, "")}_part${index + 1}.txt`,
          uploadDate: new Date(),
          charCount: part.length,
          knownWords: analysis.knownWords,
          unknownWords: analysis.unknownWords,
          difficultyPercentage: analysis.difficultyPercentage,
          folderId: newFolder.id,
        }
      })

      // Save the new books
      const existingBooks = LocalDB.getBooks()
      LocalDB.saveBooks([...existingBooks, ...newBooks])

      // Close the dialog and show success message
      onOpenChange(false)
      toast.success(`Книга разделена на ${parts.length} частей в папке "${folderName}"`)

      // Trigger refresh in parent component
      onSplit(charCount)
    } catch (error) {
      console.error("Ошибка при разделении книги:", error)
      toast.error("Не удалось разделить книгу. Пожалуйста, попробуйте снова.")
    } finally {
      setIsSplitting(false)
    }
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
            <div className="grid grid-flow-col grid-rows-4 gap-2">
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
            <Button onClick={handleSplitClick} disabled={isSplitting}>
              {isSplitting ? "Разделение..." : "Разделить"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
