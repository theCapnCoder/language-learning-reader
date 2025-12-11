"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "./ui/button"
import { X } from "lucide-react"
import { translateText } from "@/lib/groq-api"

interface WordWithContext {
  word: string
  sentence: string
}

interface WordLearningModalProps {
  words: WordWithContext[]
  isOpen: boolean
  onClose: () => void
}

interface TranslationCache {
  [key: number]: {
    word: string
    sentence: string
  } | null
}

// Вспомогательная функция для проверки, является ли слово загружаемым
const isWordLoadable = (word: string | undefined | null): boolean => {
  return !!(word && word.trim().length > 0)
}

export function WordLearningModal({ words, isOpen, onClose }: WordLearningModalProps) {
  console.log(words)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [translationCache, setTranslationCache] = useState<TranslationCache>({})
  const [currentTranslation, setCurrentTranslation] = useState<{
    word: string
    sentence: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const prevIndexRef = useRef(-1)
  const isInitialMount = useRef(true)

  const currentWord = words[currentIndex]

  // Загружаем перевод для текущего слова
  const loadTranslation = useCallback(async () => {
    // Пропускаем загрузку, если модальное окно закрыто или слово не загружаемо
    if (!isOpen || !currentWord || !isWordLoadable(currentWord.word)) {
      return
    }

    // Если перевод уже загружен, используем кеш
    if (translationCache[currentIndex] !== undefined) {
      setCurrentTranslation(translationCache[currentIndex])
      return
    }

    // Устанавливаем флаг загрузки и очищаем ошибки
    setIsLoading(true)
    setError(null)

    try {
      // Устанавливаем null в кеш, чтобы избежать повторных запросов
      setTranslationCache((prev) => ({
        ...prev,
        [currentIndex]: null,
      }))

      const [wordTranslation, sentenceTranslation] = await Promise.all([
        translateText(currentWord.word),
        translateText(currentWord.sentence),
      ])

      const newTranslation = {
        word: wordTranslation,
        sentence: sentenceTranslation,
      }

      // Обновляем кеш
      setTranslationCache((prev) => ({
        ...prev,
        [currentIndex]: newTranslation,
      }))

      setCurrentTranslation(newTranslation)
    } catch (err) {
      console.error("Translation error:", err)
      setError("Ошибка при загрузке перевода")

      // Удаляем null из кеша при ошибке, чтобы можно было повторить запрос
      setTranslationCache((prev) => {
        const newCache = { ...prev }
        delete newCache[currentIndex]
        return newCache
      })
    } finally {
      setIsLoading(false)
    }
  }, [currentIndex, currentWord, isOpen, translationCache])

  // Обработчик для кнопки "Повторить"
  const handleRetry = useCallback(() => {
    if (currentWord) {
      // Очищаем кеш для текущего слова и пробуем загрузить снова
      setTranslationCache((prev) => {
        const newCache = { ...prev }
        delete newCache[currentIndex]
        return newCache
      })
      loadTranslation()
    }
  }, [currentIndex, currentWord, loadTranslation])

  // Эффект для загрузки перевода при изменении индекса или открытии модального окна
  useEffect(() => {
    if (!isOpen) return

    // Пропускаем первый рендер, если это не открытие модального окна
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    // Загружаем перевод только если изменился индекс или это первое открытие
    if (prevIndexRef.current !== currentIndex) {
      loadTranslation()
      prevIndexRef.current = currentIndex
    }
  }, [isOpen, currentIndex, loadTranslation])

  // Эффект для загрузки перевода при первом открытии модального окна
  useEffect(() => {
    if (isOpen && isInitialMount.current) {
      loadTranslation()
      isInitialMount.current = false
    }
  }, [isOpen, loadTranslation])

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      // Обновляем индекс и сбрасываем текущий перевод
      setCurrentIndex((prev) => prev + 1)
      setCurrentTranslation(null)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      // Обновляем индекс и сбрасываем текущий перевод
      setCurrentIndex((prev) => prev - 1)
      setCurrentTranslation(null)
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
          <h2 className="text-2xl font-bold">Изучение слов</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Закрыть"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Слово:</h3>
            <p className="text-2xl font-bold">{currentWord.word}</p>
            {isLoading ? (
              <p className="text-gray-500 mt-2">Загрузка перевода...</p>
            ) : currentTranslation?.word ? (
              <p className="text-lg mt-2">
                <span className="text-gray-500">Перевод:</span> {currentTranslation.word}
              </p>
            ) : (
              <p className="text-gray-500 mt-2">Нажмите для загрузки перевода</p>
            )}
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">В предложении:</h3>
            <p className="text-lg">{highlightWord(currentWord.sentence, currentWord.word)}</p>
            {isLoading ? (
              <p className="text-gray-500 mt-2">Загрузка перевода предложения...</p>
            ) : currentTranslation?.sentence ? (
              <p className="mt-2 text-gray-700">
                <span className="text-gray-500">Перевод:</span> {currentTranslation.sentence}
              </p>
            ) : (
              <p className="text-gray-500 mt-2">Нажмите для загрузки перевода</p>
            )}
          </div>

          {isLoading && (
            <div className="text-center py-4">
              <p>Загрузка перевода...</p>
              <div className="animate-pulse mt-2">
                <div className="h-2 bg-gray-200 rounded w-3/4 mx-auto"></div>
                <div className="h-2 bg-gray-200 rounded w-1/2 mx-auto mt-2"></div>
              </div>
            </div>
          )}
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
              disabled={currentIndex === 0 || isLoading}
              variant="outline"
            >
              Назад
            </Button>
            <div className="text-gray-500">
              {currentIndex + 1} / {words.length}
            </div>
            <Button onClick={handleNext} disabled={currentIndex === words.length - 1 || isLoading}>
              Далее
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
