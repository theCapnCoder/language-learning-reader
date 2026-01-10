"use client"

import Link from "next/link"
import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { BookOpen, Trash2, BarChart3, Brain, Loader2, X, Scissors } from "lucide-react"
import { SplitBookDialog } from "./split-book-dialog"
import type { Book } from "@/lib/db"
import { LocalDB, TextAnalyzer } from "@/lib/db"
import * as Progress from "@radix-ui/react-progress"

interface BookCardProps {
  book: Book
  onDelete: (bookId: string) => void
  onBookListChange?: () => void
}

interface LevelAnalysis {
  level: string
  description: string
  examples: Array<{
    word: string
    translation: string
    meaning: string
  }>
}

export function BookCard({ book, onDelete, onBookListChange }: BookCardProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [levelAnalysis, setLevelAnalysis] = useState<LevelAnalysis | null>(null)
  const [currentBatch, setCurrentBatch] = useState(0)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSplitDialogOpen, setIsSplitDialogOpen] = useState(false)

  const getDifficultyLabel = (percentage: number) => {
    if (percentage < 5) return "Очень легкий"
    if (percentage < 10) return "Начальный"
    if (percentage < 15) return "Базовый"
    if (percentage < 20) return "Средний"
    if (percentage < 40) return "Сложный"
    if (percentage < 60) return "Очень сложный"
    return "Экстремальный"
  }

  const getDifficultyColor = (percentage: number) => {
    if (percentage < 5) return "bg-indigo-400"
    if (percentage < 10) return "bg-blue-400"
    if (percentage < 15) return "bg-green-500"
    if (percentage < 20) return "bg-yellow-400"
    if (percentage < 40) return "bg-orange-500"
    if (percentage < 60) return "bg-red-600"
    return "bg-purple-700"
  }

  const analyzeLevel = async (batchNumber = 0) => {
    setIsAnalyzing(true)

    try {
      // Get unknown words from the book
      const dictionary = LocalDB.getDictionary()
      const knownWordsSet = new Set(
        dictionary.filter((w) => w.isKnown).map((w) => w.word.toLowerCase())
      )
      const bookWords = TextAnalyzer.extractWords(book.content)
      const uniqueWords = Array.from(new Set(bookWords))
      const unknownWords = uniqueWords.filter((word) => !knownWordsSet.has(word.toLowerCase()))

      // Get 50 words starting from the current batch
      const startIndex = batchNumber * 50
      const wordsToAnalyze = unknownWords.slice(startIndex, startIndex + 50)

      if (wordsToAnalyze.length === 0) {
        setLevelAnalysis({
          level: "Нет неизвестных слов",
          description: "Все слова в этой книге уже изучены!",
          examples: [],
        })
        setIsAnalyzing(false)
        return
      }

      const settings = LocalDB.getSettings()
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: `Проанализируй уровень сложности этих английских слов и определи общий уровень английского языка (A1, A2, B1, B2, C1, C2): ${wordsToAnalyze.join(", ")}. 
          
          Дай ответ в формате JSON:
          {
            "level": "уровень (например B1)",
            "description": "описание уровня и сложности слов",
            "examples": [
              {"word": "слово", "translation": "перевод", "meaning": "значение и контекст"},
              // 10 примеров самых важных слов
            ]
          }`,
          apiKey: settings.groqApiKey,
        }),
      })

      if (!response.ok) {
        throw new Error("Ошибка анализа уровня")
      }

      const result = await response.json()

      try {
        const analysis = JSON.parse(result.translation)
        setLevelAnalysis(analysis)
        setCurrentBatch(batchNumber)
      } catch {
        // Fallback if JSON parsing fails
        setLevelAnalysis({
          level: "Анализ завершен",
          description: result.translation,
          examples: [],
        })
      }
    } catch (error) {
      console.error("Error analyzing level:", error)
      setLevelAnalysis({
        level: "Ошибка",
        description: "Не удалось проанализировать уровень. Проверьте настройки API.",
        examples: [],
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              <span>{book.charCount ? book.charCount.toLocaleString() : "0"}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={`${getDifficultyColor(book.difficultyPercentage)} text-white`}
            >
              {getDifficultyLabel(book.difficultyPercentage)}
            </Badge>
          </div>
        </div>
        <h3
          className="font-semibold text-lg mb-2 break-all overflow-wrap-anywhere hyphens-auto whitespace-normal max-w-full"
          style={{ wordBreak: "break-all", overflowWrap: "anywhere", maxWidth: "100%" }}
        >
          {book.title}
        </h3>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Book cover placeholder */}
        <div className="w-full h-32 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg mb-4 flex items-center justify-center border">
          <BookOpen className="h-12 w-12 text-primary/40" />
        </div>

        <div className="w-full space-y-2 mb-4">
          <Progress.Root
            className="relative overflow-hidden bg-gray-200 rounded-full h-2.5"
            value={book.difficultyPercentage}
          >
            <Progress.Indicator
              className="bg-green-500 w-full h-full transition-transform duration-300"
              style={{ transform: `translateX(-${book.difficultyPercentage}%)` }}
            />
          </Progress.Root>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="flex items-center">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
              {book.knownWords} изучено
            </span>
            <span className="flex items-center">
              <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-1"></span>
              {book.unknownWords} неизвестно
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Сложность:</span>
          <span className="text-sm font-medium">{book.difficultyPercentage}%</span>
        </div>
        {/* Actions */}
        <div className="flex gap-2 mb-2">
          <Button asChild className="flex-1">
            <Link href={`/read/${book.id}`}>Читать</Link>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onDelete(book.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              setIsSplitDialogOpen(true)
            }}
            title="Разделить книгу на части"
          >
            <Scissors className="h-4 w-4 text-blue-700" />
          </Button>
          <SplitBookDialog
            isOpen={isSplitDialogOpen}
            onOpenChange={setIsSplitDialogOpen}
            onSplit={() => {
              // Обновляем список книг после разделения
              if (onBookListChange) {
                onBookListChange()
              }
            }}
            book={book}
            bookLength={book.charCount}
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => analyzeLevel(0)}
            >
              <Brain className="h-4 w-4 mr-2" />
              Узнать уровень
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Анализ уровня сложности</DialogTitle>
            </DialogHeader>

            {isAnalyzing ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <span>Анализируем уровень сложности...</span>
              </div>
            ) : levelAnalysis ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Уровень: {levelAnalysis.level}</h3>
                  <p className="text-muted-foreground">{levelAnalysis.description}</p>
                </div>

                {levelAnalysis.examples.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Примеры слов:</h4>
                    <div className="grid gap-3">
                      {levelAnalysis.examples.map((example, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="font-medium">{example.word}</div>
                          <div className="text-sm text-muted-foreground">{example.translation}</div>
                          <div className="text-sm mt-1">{example.meaning}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => analyzeLevel(currentBatch + 1)}
                    disabled={isAnalyzing}
                  >
                    Следующие 50 слов
                  </Button>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    <X className="h-4 w-4 mr-2" />
                    Закрыть
                  </Button>
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
