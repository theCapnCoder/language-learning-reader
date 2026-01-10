"use client"

import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Languages, X, Plus } from "lucide-react"
import { GroqAPI } from "@/lib/groq-api"
import { LocalDB } from "@/lib/db"
import type { AppSettings } from "@/lib/db"

interface InteractiveTextProps {
  content: string
  knownWords: Set<string>
  highlightColor: string
  onWordsUpdated?: () => void
  sentenceTranslations: Map<string, string>
  loadingSentences: Set<string>
  onTranslateSentence: (sentence: string) => void
  textSettings?: AppSettings
}

interface Translation {
  word?: string
  sentence?: string
  content: string
  loading: boolean
}

interface SentenceTranslation {
  sentence: string
  translation: string
}

export function InteractiveText({
  content,
  knownWords,
  highlightColor,
  onWordsUpdated,
  sentenceTranslations,
  loadingSentences,
  onTranslateSentence,
  textSettings,
}: InteractiveTextProps) {
  const [translation, setTranslation] = useState<Translation | null>(null)
  const [displayMode, setDisplayMode] = useState<"modal" | "brackets">("modal")
  const [bracketTranslations, setBracketTranslations] = useState<Map<string, string>>(new Map())

  // Get text styles from settings or use defaults
  const getTextStyle = () => ({
    fontSize: `${textSettings?.fontSize || 16}px`,
    lineHeight: textSettings?.lineHeight || 1.6,
    letterSpacing: `${textSettings?.letterSpacing || 0}px`,
    wordSpacing: `${textSettings?.wordSpacing || 0}px`,
    textAlign: textSettings?.textAlign || ("left" as const),
    fontFamily: textSettings?.fontFamily || "system-ui",
  })

  const getParagraphStyle = () => ({
    marginBottom: `${textSettings?.paragraphSpacing || 16}px`,
  })

  const handleWordClick = useCallback(
    async (word: string, sentence: string) => {
      if (displayMode === "brackets") {
        // В режиме скобок отправляем запрос на сервер с контекстом
        const settings = LocalDB.getSettings()

        if (!settings.groqApiKey) {
          setBracketTranslations((prev) => {
            const newMap = new Map(prev)
            newMap.set(word, "API ключ не настроен")
            return newMap
          })
          return
        }

        // Сначала показываем заглушку
        setBracketTranslations((prev) => {
          const newMap = new Map(prev)
          newMap.set(word, "переводим...")
          return newMap
        })

        try {
          const translationContent = await GroqAPI.translateWordWithBrackets(
            word,
            sentence,
            settings.groqApiKey
          )
          setBracketTranslations((prev) => {
            const newMap = new Map(prev)
            newMap.set(word, translationContent)
            return newMap
          })
        } catch (error) {
          setBracketTranslations((prev) => {
            const newMap = new Map(prev)
            newMap.set(
              word,
              `ошибка: ${error instanceof Error ? error.message : "неизвестная ошибка"}`
            )
            return newMap
          })
        }
        return
      }

      const settings = LocalDB.getSettings()

      if (!settings.groqApiKey) {
        setTranslation({
          word,
          content: "API ключ Groq не настроен. Перейдите в настройки для его добавления.",
          loading: false,
        })
        return
      }

      setTranslation({
        word,
        content: "",
        loading: true,
      })

      try {
        const translationContent = await GroqAPI.translateWord(word, sentence, settings.groqApiKey)
        setTranslation({
          word,
          content: translationContent,
          loading: false,
        })
      } catch (error) {
        setTranslation({
          word,
          content: `Ошибка перевода: ${error instanceof Error ? error.message : "Неизвестная ошибка"}`,
          loading: false,
        })
      }
    },
    [displayMode]
  )

  const handleAddWordAsKnown = useCallback(() => {
    if (!translation?.word) return

    const dictionary = LocalDB.getDictionary()
    const existingWord = dictionary.find((w) => w.word === translation.word)

    if (existingWord) {
      existingWord.isKnown = true
      existingWord.updatedAt = new Date().toISOString()
    } else {
      dictionary.push({
        id: Date.now().toString(),
        word: translation.word,
        isKnown: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }

    LocalDB.saveDictionary(dictionary)
    setTranslation(null)
    onWordsUpdated?.()
  }, [translation?.word, onWordsUpdated])

  const handleSentenceTranslate = useCallback(
    (sentence: string) => {
      onTranslateSentence(sentence)
    },
    [onTranslateSentence]
  )

  // Компонент кнопки перевода предложения с мемоизацией по предложению
  const TranslateButton = useCallback(
    ({ sentence }: { sentence: string }) => (
      <Button
        variant="ghost"
        size="sm"
        className="ml-1 opacity-50 hover:opacity-100 transition-colors"
        style={{
          width: `${textSettings?.translationIconSize || 24}px`,
          height: `${textSettings?.translationIconSize || 24}px`,
          padding: "0",
        }}
        onClick={(e) => {
          e.stopPropagation()
          handleSentenceTranslate(sentence)
        }}
      >
        <Languages
          style={{
            width: `${(textSettings?.translationIconSize || 24) * 0.5}px`,
            height: `${(textSettings?.translationIconSize || 24) * 0.5}px`,
          }}
        />
      </Button>
    ),
    [handleSentenceTranslate, textSettings?.translationIconSize]
  )

  // Мемоизированный компонент загрузки
  const LoadingSpinner = useCallback(
    () => (
      <Loader2
        className="inline animate-spin opacity-50 ml-1"
        style={{
          width: `${(textSettings?.translationIconSize || 24) * 0.5}px`,
          height: `${(textSettings?.translationIconSize || 24) * 0.5}px`,
        }}
      />
    ),
    [textSettings?.translationIconSize]
  )

  // Мемоизированный компонент перевода
  const TranslationText = useCallback(
    ({ translation }: { translation: string }) => (
      <span className="text-muted-foreground text-sm italic ml-2 inline">{translation}</span>
    ),
    []
  )

  const renderedText = useMemo(() => {
    const lines = content.split("\n")

    return lines.map((line, lineIndex) => {
      const sentences = line.split(/([.!?]+)/).filter((part) => part.trim())

      return (
        <div key={lineIndex} style={getParagraphStyle()}>
          {sentences.map((part, sentenceIndex) => {
            if (/^[.!?]+$/.test(part)) {
              const prevSentenceIndex = sentenceIndex - 1
              const prevSentence =
                prevSentenceIndex >= 0 ? sentences[prevSentenceIndex]?.trim() : ""

              if (!prevSentence) {
                return <span key={sentenceIndex}>{part}</span>
              }

              const isTranslating = loadingSentences.has(prevSentence)
              const translation = sentenceTranslations.get(prevSentence)

              return (
                <span key={sentenceIndex}>
                  {part}
                  {isTranslating ? <LoadingSpinner /> : <TranslateButton sentence={prevSentence} />}
                  {translation && <TranslationText translation={translation} />}
                </span>
              )
            }
            const sentence = part.trim()
            if (!sentence) return null
            const words = sentence.split(/([\s,;:()[\]{}""«»„”—–-]+)/).filter((word) => word.trim())
            return (
              <span key={sentenceIndex} className="relative">
                {words.map((word, wordIndex) => {
                  if (/^[\s,;:()[\]{}""«»„”—–-]+$/.test(word)) {
                    return <span key={wordIndex}>{word}</span>
                  }
                  // Clean the word while preserving apostrophes in contractions
                  let cleanWord = word
                    .toLowerCase()
                    // Remove surrounding quotes and punctuation, including leading apostrophes
                    .replace(/^[^\w]+|'$|'([^a-zA-Z])/g, "$1")
                    // Keep only letters and apostrophes in the middle of words
                    .replace(/[^a-zA-Zа-яА-Я']/g, "")

                  // Check both the exact form and the base form (without 's)
                  const baseWord = cleanWord.replace(/'s$/, "")
                  const isKnown =
                    cleanWord && (knownWords.has(cleanWord) || knownWords.has(baseWord))
                  const bracketTranslation = bracketTranslations.get(cleanWord)
                  return (
                    <span key={wordIndex} className="relative">
                      <span
                        className={`cursor-pointer hover:bg-accent hover:text-accent-foreground rounded px-1 transition-colors ${
                          isKnown ? "font-medium" : ""
                        }`}
                        style={{
                          color: isKnown ? highlightColor : "inherit",
                        }}
                        onClick={() => handleWordClick(cleanWord, sentence)}
                      >
                        {word}
                      </span>
                      {bracketTranslation && (
                        <span className="text-muted-foreground text-sm">
                          {" "}
                          ({bracketTranslation})
                        </span>
                      )}
                    </span>
                  )
                })}
              </span>
            )
          })}
        </div>
      )
    })
  }, [
    content,
    knownWords,
    highlightColor,
    sentenceTranslations,
    loadingSentences,
    handleWordClick,
    handleSentenceTranslate,
    bracketTranslations,
    displayMode,
  ])

  return (
    <div className="space-y-4">
      {/* Кнопка переключения режима */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={displayMode === "modal" ? "default" : "outline"}
          size="sm"
          onClick={() => setDisplayMode("modal")}
        >
          Модальное окно
        </Button>
        <Button
          variant={displayMode === "brackets" ? "default" : "outline"}
          size="sm"
          onClick={() => setDisplayMode("brackets")}
        >
          Скобки
        </Button>
      </div>

      <div
        className="prose prose-lg max-w-none text-pretty break-words overflow-wrap-anywhere hyphens-auto"
        style={getTextStyle()}
      >
        {renderedText}
      </div>

      {/* Word translation popup - только в режиме модального окна */}
      {displayMode === "modal" && translation?.word && (
        <Card className="fixed bottom-4 right-4 max-w-sm z-50 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                {!translation.loading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 border border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                    onClick={handleAddWordAsKnown}
                    title="Добавить как изученное"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                )}
                <h4 className="font-semibold text-primary">{translation.word}</h4>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setTranslation(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            {translation.loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Переводим...</span>
              </div>
            ) : (
              <div className="text-sm whitespace-pre-wrap">{translation.content}</div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
