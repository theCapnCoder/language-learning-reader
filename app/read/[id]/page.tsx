"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { InteractiveText } from "@/components/interactive-text"
import { ReadingControls } from "@/components/reading-controls"
import { WordLearningModal } from "@/components/word-learning-modal"
import { ArrowLeft, BookOpen, BarChart3, BookMarked } from "lucide-react"
import { LocalDB } from "@/lib/db"
import { GroqAPI } from "@/lib/groq-api"
import type { Book, ReadingProgress, AppSettings } from "@/lib/db"

export default function ReadBookPage() {
  const params = useParams()
  const router = useRouter()
  const bookId = params.id as string
  const contentRef = useRef<HTMLDivElement>(null)

  const [book, setBook] = useState<Book | null>(null)
  const [knownWords, setKnownWords] = useState<Set<string>>(new Set())
  const [fontSize, setFontSize] = useState(16)
  const [highlightColor, setHighlightColor] = useState("#3b82f6")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [readingProgress, setReadingProgress] = useState(0)
  const [sentenceTranslations, setSentenceTranslations] = useState<Map<string, string>>(new Map())
  const [loadingSentences, setLoadingSentences] = useState<Set<string>>(new Set())
  const [showWordLearning, setShowWordLearning] = useState(false)
  const [unknownWords, setUnknownWords] = useState<Array<{ word: string; sentence: string }>>([])
  const [textSettings, setTextSettings] = useState<AppSettings | undefined>(undefined)

  const loadBookData = () => {
    // Load book
    const books = LocalDB.getBooks()
    const foundBook = books.find((b) => b.id === bookId)

    if (!foundBook) {
      router.push("/")
      return
    }

    setBook(foundBook)

    // Load dictionary
    const dictionary = LocalDB.getDictionary()
    const knownWordsSet = new Set(
      dictionary.filter((w) => w.isKnown).map((w) => w.word.toLowerCase())
    )
    setKnownWords(knownWordsSet)

    // Load settings
    const settings = LocalDB.getSettings()
    setHighlightColor(settings.highlightColor)
    setTextSettings(settings)

    const progressData = LocalDB.getProgress()
    const bookProgress = progressData.find((p) => p.bookId === bookId)
    if (bookProgress) {
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.scrollTop = bookProgress.currentPosition
        }
      }, 100)
    }
  }

  const handleScroll = () => {
    if (contentRef.current && book) {
      const scrollTop = contentRef.current.scrollTop
      const scrollHeight = contentRef.current.scrollHeight
      const clientHeight = contentRef.current.clientHeight

      const progress = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100)
      setReadingProgress(Math.min(progress, 100))

      // Save progress to localStorage
      const progressData = LocalDB.getProgress()
      const existingIndex = progressData.findIndex((p) => p.bookId === bookId)
      const newProgress: ReadingProgress = {
        bookId,
        currentPosition: scrollTop,
        lastReadDate: new Date(),
      }

      if (existingIndex >= 0) {
        progressData[existingIndex] = newProgress
      } else {
        progressData.push(newProgress)
      }

      LocalDB.saveProgress(progressData)
    }
  }

  useEffect(() => {
    loadBookData()
  }, [bookId, router])

  useEffect(() => {
    if (!book) return

    setUnknownWords([])
    const dictionary = LocalDB.getDictionary()
    const knownWordsSet = new Set(
      dictionary.filter((w) => w.isKnown).map((w) => w.word.toLowerCase())
    )

    const wordRegex = /\b[a-zA-Z']{3,}\b/g
    const wordsWithContext: { word: string; sentence: string }[] = []
    // wordRegex.lastIndex = 0

    let match

    // Find all word occurrences with their positions
    while ((match = wordRegex.exec(book.content.toLowerCase())) !== null) {
      const word = match[0]
      if (word.length > 2 && !knownWordsSet.has(word) && /^[a-zA-Z]+$/.test(word)) {
        // Get context around the word (100 characters before and after)
        const contextStart = Math.max(0, match.index - 100)
        const contextEnd = Math.min(book.content.length, match.index + word.length + 100)

        // Get full context
        let context = book.content.slice(contextStart, contextEnd)

        // Add to results if we found a reasonable sentence
        if (context.length > 0 && context.length < 500) {
          // Limit sentence length
          wordsWithContext.push({
            word,
            sentence: context || `${word}...`,
          })
        }
      }
    }

    setUnknownWords(wordsWithContext)
  }, [book])

  const handleWordsUpdated = () => {
    loadBookData()
  }

  const handleTranslateSentence = useCallback(
    async (sentence: string) => {
      if (!sentence || loadingSentences.has(sentence)) return

      const settings = LocalDB.getSettings()
      if (!settings.groqApiKey) {
        alert("API ключ Groq не настроен. Перейдите в настройки для его добавления.")
        return
      }

      setLoadingSentences((prev) => {
        const newSet = new Set(prev)
        newSet.add(sentence)
        return newSet
      })

      try {
        const translation = await GroqAPI.translateSentence(sentence, settings.groqApiKey)
        setSentenceTranslations((prev) => {
          const newMap = new Map(prev)
          newMap.set(sentence, translation)
          return newMap
        })
      } catch (error) {
        console.error("Ошибка перевода предложения:", error)
      } finally {
        setLoadingSentences((prev) => {
          const newSet = new Set(prev)
          newSet.delete(sentence)
          return newSet
        })
      }
    },
    [loadingSentences]
  )

  const handleHighlightColorChange = (color: string) => {
    setHighlightColor(color)
    if (textSettings) {
      const updatedSettings = { ...textSettings, highlightColor: color }
      setTextSettings(updatedSettings)
      LocalDB.saveSettings(updatedSettings)
    }
  }

  const handleTextSettingsChange = (settings: AppSettings) => {
    setTextSettings(settings)
    setHighlightColor(settings.highlightColor)
    setFontSize(settings.fontSize)
    LocalDB.saveSettings(settings)
  }

  const handleDarkModeToggle = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle("dark")
  }

  if (!book) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <BookOpen className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Загрузка книги...</h2>
        </div>
      </div>
    )
  }

  const truncateTitle = (title: string, maxLength: number = 20) => {
    if (title.length <= maxLength) return title
    return title.substring(0, maxLength) + "..."
  }

  return (
    <div className="mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            if (book.folderId) {
              router.push(`/?folder=${book.folderId}`)
            } else {
              router.push("/")
            }
          }}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1
            className="text-2xl font-bold text-balance break-words"
            title={book.title} // Show full title on hover
          >
            {truncateTitle(book.title)}
          </h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
            <span>{(book.charCount || 0).toLocaleString()}</span>
            <span>•</span>
            <div className="flex items-center gap-3">
              <BarChart3 className="h-4 w-4" />
              <span>Сложность: {book.difficultyPercentage}%</span>
              <Button
                variant="outline"
                onClick={() => setShowWordLearning(true)}
                className="gap-2"
                disabled={unknownWords.length === 0}
              >
                <BookMarked className="h-4 w-4" />
                Изучить слова
              </Button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Прочитано: {readingProgress}%</span>
        </div>
      </div>

      <div
        ref={contentRef}
        className="reading-content break-words overflow-wrap-anywhere max-w-full"
        onScroll={handleScroll}
      >
        <InteractiveText
          content={book.content}
          knownWords={knownWords}
          highlightColor={highlightColor}
          onWordsUpdated={handleWordsUpdated}
          sentenceTranslations={sentenceTranslations}
          loadingSentences={loadingSentences}
          onTranslateSentence={handleTranslateSentence}
          textSettings={textSettings}
        />
      </div>

      <ReadingControls
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        highlightColor={highlightColor}
        onHighlightColorChange={handleHighlightColorChange}
        isDarkMode={isDarkMode}
        onDarkModeToggle={handleDarkModeToggle}
        textSettings={textSettings}
        onTextSettingsChange={handleTextSettingsChange}
      />

      <WordLearningModal
        words={unknownWords}
        isOpen={showWordLearning}
        onClose={() => setShowWordLearning(false)}
      />
    </div>
  )
}
