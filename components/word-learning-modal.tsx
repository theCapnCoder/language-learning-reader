"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "./ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { X, Plus, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { GroqAPI } from "@/lib/groq-api"
import { LocalDB } from "@/lib/db"

interface WordWithContext {
  word: string
  sentence: string
}

interface WordLearningModalProps {
  words: WordWithContext[]
  isOpen: boolean
  onClose: () => void
}

// Вспомогательные функции для управления кэшем переводов
const TranslationCache = {
  // Ключи для localStorage
  CACHE_KEY: "wordLearningTranslations",
  RESET_KEY: "wordLearningCacheReset",

  // Получить кэш переводов
  getCache(): Record<
    string,
    { wordTranslation: string; sentenceTranslation: string; explanation: string; timestamp: number }
  > {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY)
      return cached ? JSON.parse(cached) : {}
    } catch {
      return {}
    }
  },

  // Сохранить перевод в кэш
  saveTranslation(
    word: string,
    sentence: string,
    wordTranslation: string,
    sentenceTranslation: string,
    explanation: string
  ) {
    try {
      const cache = this.getCache()
      const key = `${word.toLowerCase()}_${sentence.slice(0, 50)}` // Уникальный ключ для слова+предложения

      cache[key] = {
        wordTranslation,
        sentenceTranslation,
        explanation,
        timestamp: Date.now(),
      }

      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache))
    } catch (error) {
      console.warn("Ошибка сохранения в кэш:", error)
    }
  },

  // Получить перевод из кэша
  getTranslation(
    word: string,
    sentence: string
  ): { wordTranslation: string; sentenceTranslation: string; explanation: string } | null {
    try {
      const cache = this.getCache()
      const key = `${word.toLowerCase()}_${sentence.slice(0, 50)}`
      const cached = cache[key]

      // Проверяем что кэш не старше 24 часов
      if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
        return {
          wordTranslation: cached.wordTranslation,
          sentenceTranslation: cached.sentenceTranslation,
          explanation: cached.explanation,
        }
      }

      return null
    } catch {
      return null
    }
  },

  // Сбросить кэш при первом запуске
  resetOnFirstLoad() {
    try {
      const hasReset = localStorage.getItem(this.RESET_KEY)

      if (!hasReset) {
        // Первый запуск - сбрасываем кэш
        localStorage.removeItem(this.CACHE_KEY)
        localStorage.setItem(this.RESET_KEY, Date.now().toString())
        console.log("Кэш переводов сброшен при первом запуске")
      }
    } catch (error) {
      console.warn("Ошибка сброса кэша:", error)
    }
  },

  // Очистка старого кэша (старше 24 часов)
  cleanupOldCache() {
    try {
      const cache = this.getCache()
      const now = Date.now()
      const dayInMs = 24 * 60 * 60 * 1000

      let hasChanges = false
      Object.keys(cache).forEach((key) => {
        if (now - cache[key].timestamp > dayInMs) {
          delete cache[key]
          hasChanges = true
        }
      })

      if (hasChanges) {
        localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache))
        console.log("Старый кэш переводов очищен")
      }
    } catch (error) {
      console.warn("Ошибка очистки кэша:", error)
    }
  },
}

// Вспомогательная функция для проверки, является ли слово загружаемым
const isWordLoadable = (word: string | undefined | null): boolean => {
  return !!(word && word.trim().length > 0)
}

export function WordLearningModal({ words, isOpen, onClose }: WordLearningModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [wordTranslation, setWordTranslation] = useState<string | null>(null)
  const [sentenceTranslation, setSentenceTranslation] = useState<string | null>(null)
  const [wordExplanation, setWordExplanation] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const prevIndexRef = useRef(-1)
  const isInitialMount = useRef(true)

  // Pagination states
  const [wordsPerPage, setWordsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(0)

  // Load words per page from localStorage on mount и инициализация кэша
  useEffect(() => {
    // Инициализация кэша при первом запуске
    TranslationCache.resetOnFirstLoad()

    // Очистка старого кэша
    TranslationCache.cleanupOldCache()

    const savedWordsPerPage = localStorage.getItem("wordLearningWordsPerPage")
    if (savedWordsPerPage) {
      const value = parseInt(savedWordsPerPage)
      if ([10, 20, 30].includes(value)) {
        setWordsPerPage(value)
      }
    }
  }, [])

  // Calculate pagination
  const totalPages = Math.ceil(words.length / wordsPerPage)
  const startIndex = currentPage * wordsPerPage
  const endIndex = Math.min(startIndex + wordsPerPage, words.length)
  const currentWords = words.slice(startIndex, endIndex)
  const actualCurrentIndex = startIndex + currentIndex

  // Исправляю порядок объявлений - сначала вычисляю currentWords, потом использую его для currentWord
  const currentWord = currentWords[currentIndex]

  // Загружаем перевод для текущего слова и предложения
  const loadTranslation = useCallback(async () => {
    // Пропускаем загрузку, если модальное окно закрыто или слово не загружаемо
    if (!isOpen || !currentWord || !isWordLoadable(currentWord.word)) {
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Сначала проверяем кэш
      const cached = TranslationCache.getTranslation(currentWord.word, currentWord.sentence)

      if (cached) {
        // Используем кэшированные данные
        setWordTranslation(cached.wordTranslation)
        setSentenceTranslation(cached.sentenceTranslation)
        setWordExplanation(cached.explanation)
        setIsLoading(false)
        return
      }

      // Получаем API ключ
      const settings = LocalDB.getSettings()
      const apiKey = settings?.groqApiKey || ""

      if (!apiKey) {
        throw new Error("API ключ Groq не настроен")
      }

      // Загружаем все данные одним запросом
      const wordData = await GroqAPI.getWordDataComplete(
        currentWord.word,
        currentWord.sentence,
        apiKey
      )

      // Сохраняем в кэш
      TranslationCache.saveTranslation(
        currentWord.word,
        currentWord.sentence,
        wordData.wordTranslation,
        wordData.sentenceTranslation,
        wordData.explanation
      )

      setWordTranslation(wordData.wordTranslation)
      setSentenceTranslation(wordData.sentenceTranslation)
      setWordExplanation(wordData.explanation)
    } catch (err) {
      console.error("Translation error:", err)

      // Проверяем на ошибку 429 (Too Many Requests)
      if (err instanceof Error && err.message.includes("429")) {
        setError("Слишком много запросов. Повторная попытка через 2 секунды...")
        // Автоматически повторяем запрос через 2 секунды
        setTimeout(() => {
          if (isOpen && currentWord) {
            loadTranslation()
          }
        }, 2000)
        return
      }

      setError("Ошибка при загрузке перевода")
      setWordTranslation(null)
      setSentenceTranslation(null)
      setWordExplanation(null)
    } finally {
      setIsLoading(false)
    }
  }, [currentIndex, currentWord, isOpen, currentPage])

  // Обработчик для загрузки перевода по клику
  const handleLoadTranslation = () => {
    loadTranslation()
  }
  const handleRetry = useCallback(() => {
    if (currentWord) {
      // Сбрасываем текущие переводы и загружаем заново
      setWordTranslation(null)
      setSentenceTranslation(null)
      setWordExplanation(null)
      loadTranslation()
    }
  }, [currentWord, loadTranslation])

  // Эффект для загрузки перевода при изменении индекса или страницы
  useEffect(() => {
    if (!isOpen) return

    // Пропускаем первый рендер
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    // Загружаем перевод если изменился индекс
    if (prevIndexRef.current !== currentIndex) {
      loadTranslation()
      prevIndexRef.current = currentIndex
    }
  }, [isOpen, currentIndex, loadTranslation])

  // Эффект для первого открытия модального окна
  useEffect(() => {
    if (isOpen && isInitialMount.current) {
      // Загружаем перевод для первого слова
      loadTranslation()
      isInitialMount.current = false
    }
  }, [isOpen, loadTranslation])

  const handleNext = () => {
    if (isLoading) return // Блокируем переход во время загрузки

    if (currentIndex < currentWords.length - 1) {
      // Обновляем индекс но НЕ сбрасываем переводы
      setCurrentIndex((prev) => prev + 1)
      // Загружаем перевод автоматически
    } else if (currentPage < totalPages - 1) {
      // Переходим на следующую страницу
      setCurrentPage((prev) => prev + 1)
      setCurrentIndex(0)
      // Загружаем перевод автоматически
    }
  }

  const handlePrevious = () => {
    if (isLoading) return // Блокируем переход во время загрузки

    if (currentIndex > 0) {
      // Обновляем индекс но НЕ сбрасываем переводы
      setCurrentIndex((prev) => prev - 1)
      // Загружаем перевод автоматически
    } else if (currentPage > 0) {
      // Переходим на предыдущую страницу
      setCurrentPage((prev) => prev - 1)
      setCurrentIndex(wordsPerPage - 1)
      // Загружаем перевод автоматически
    }
  }

  const handleAddWordAsKnown = useCallback(() => {
    if (!currentWord?.word) return

    try {
      LocalDB.addOrUpdateWord(currentWord.word, true)
      handleNext()
    } catch (error) {
      console.error("Ошибка при добавлении слова в словарь:", error)
      setError("Не удалось добавить слово в словарь")
    }
  }, [currentWord?.word, handleNext])

  // Reset current index when page changes
  useEffect(() => {
    if (currentPage === 0 && isInitialMount.current) {
      // Don't reset on initial mount with page 0
      return
    }

    setCurrentIndex(0)
    // НЕ сбрасываем переводы - пусть остаются на месте во время загрузки
    // Загружаем перевод для первого слова новой страницы
    if (isOpen && words.length > 0 && currentWords.length > 0) {
      loadTranslation()
    }
  }, [currentPage, isOpen, words.length, currentWords.length])

  // Reset to first page when words per page changes
  const handleWordsPerPageChange = (newWordsPerPage: number) => {
    setWordsPerPage(newWordsPerPage)
    setCurrentPage(0)
    setCurrentIndex(0)
    // НЕ сбрасываем переводы при изменении количества слов
    // Save to localStorage
    localStorage.setItem("wordLearningWordsPerPage", newWordsPerPage.toString())
    // Загружаем перевод для первого слова
    if (isOpen && words.length > 0) {
      loadTranslation()
    }
  }

  // Handle page navigation
  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage)
      // Reset index but НЕ сбрасываем переводы
      setCurrentIndex(0)
      if (isOpen && words.length > 0) {
        loadTranslation()
      }
    }
  }

  if (!isOpen || !currentWord) return null

  const highlightWord = (sentence: string, word: string) => {
    const parts = sentence.split(new RegExp(`(${word})`, "gi"))
    return parts.map((part, i) =>
      part.toLowerCase() === word.toLowerCase() ? (
        <span key={i} className="text-red-500 font-bold">
          {part}
        </span>
      ) : (
        part
      )
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold">Изучение слов</h2>
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-blue-500 text-blue-500 hover:bg-blue-50 hover:text-blue-600"
              onClick={handleAddWordAsKnown}
              title="Добавить как изученное"
            >
              <Plus className="h-4 w-4 mr-1" />
              <span>Добавить в изученные</span>
            </Button>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Закрыть"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Pagination controls */}
        <div className="flex items-center justify-between mb-4 p-3 bg-gray-100 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Слов на странице:</span>
            <Select
              value={wordsPerPage.toString()}
              onValueChange={(value) => handleWordsPerPageChange(parseInt(value))}
            >
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="30">30</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Страница {currentPage + 1} из {totalPages} (всего слов: {words.length})
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages - 1}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-4 bg-gray-50 rounded-lg relative">
            {isLoading && (
              <div className="absolute top-2 right-2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
              </div>
            )}
            <h3 className="text-lg font-semibold mb-2">Слово:</h3>
            <p className="text-2xl font-bold">{currentWord.word}</p>
            {wordTranslation ? (
              <p className="text-lg mt-2">
                <span className="text-gray-500">Перевод:</span> {wordTranslation}
              </p>
            ) : (
              <p className="text-gray-500 mt-2">Перевод появится здесь</p>
            )}
          </div>

          {wordExplanation && (
            <div className="p-4 bg-blue-50 rounded-lg relative">
              <h3 className="text-lg font-semibold mb-2">Объяснение:</h3>
              <p className="text-gray-700">{wordExplanation}</p>
            </div>
          )}

          <div className="p-4 bg-gray-50 rounded-lg relative">
            {isLoading && (
              <div className="absolute top-2 right-2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
              </div>
            )}
            <h3 className="text-lg font-semibold mb-2">В предложении:</h3>
            <p className="text-lg">{highlightWord(currentWord.sentence, currentWord.word)}</p>
            {sentenceTranslation ? (
              <p className="mt-2 text-gray-700">
                <span className="text-gray-500">Перевод:</span> {sentenceTranslation}
              </p>
            ) : (
              <p className="text-gray-500 mt-2">Перевод предложения появится здесь</p>
            )}
          </div>

          {error && (
            <div className="text-center py-2">
              <p className="text-red-500 mb-2">{error}</p>
              <Button variant="outline" size="sm" onClick={handleRetry}>
                Повторить
              </Button>
            </div>
          )}

          <div className="flex justify-between mt-6">
            <Button
              onClick={handlePrevious}
              disabled={(currentIndex === 0 && currentPage === 0) || isLoading}
              variant="outline"
            >
              Назад
            </Button>
            <div className="text-gray-500">
              {currentIndex + 1} / {currentWords.length} (страница {currentPage + 1} из {totalPages}
              )
            </div>
            <Button
              onClick={handleNext}
              disabled={
                (currentIndex === currentWords.length - 1 && currentPage === totalPages - 1) ||
                isLoading
              }
            >
              Далее
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
