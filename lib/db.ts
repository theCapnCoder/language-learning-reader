// Database types and utilities for the language learning app
export interface Book {
  id: string
  title: string
  content: string
  fileName: string
  uploadDate: Date
  charCount: number
  knownWords: number
  unknownWords: number
  difficultyPercentage: number
  folderId?: string // Optional folder ID
}

export interface DictionaryWord {
  id: string
  word: string
  isKnown: boolean
  createdAt: string
  updatedAt: string
}

export interface ReadingProgress {
  bookId: string
  currentPosition: number
  lastReadDate: Date
}

export interface AppSettings {
  highlightColor: string
  groqApiKey: string
  fontSize: number
  lineHeight: number
  letterSpacing: number
  wordSpacing: number
  paragraphSpacing: number
  textAlign: "left" | "center" | "justify" | "right"
  fontFamily: string
  translationIconSize: number
}

export interface Folder {
  id: string
  name: string
  createdDate: Date
}

// Local storage keys
export const STORAGE_KEYS = {
  BOOKS: "language_reader_books",
  FOLDERS: "language_reader_folders", // Added folders storage key
  DICTIONARY: "language_reader_dictionary",
  PROGRESS: "language_reader_progress",
  SETTINGS: "language_reader_settings",
} as const

// Database utilities using localStorage
export class LocalDB {
  static getBooks(): Book[] {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem(STORAGE_KEYS.BOOKS)
    return stored ? JSON.parse(stored) : []
  }

  static saveBooks(books: Book[]): void {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books))
  }

  static getFolders(): Folder[] {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem(STORAGE_KEYS.FOLDERS)
    return stored ? JSON.parse(stored) : []
  }

  static saveFolders(folders: Folder[]): void {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders))
  }

  static getDictionary(): DictionaryWord[] {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem(STORAGE_KEYS.DICTIONARY)
    return stored ? JSON.parse(stored) : []
  }

  static addOrUpdateWord(word: string, isKnown: boolean = true): void {
    if (typeof window === "undefined") return

    try {
      const dictionary = this.getDictionary()
      const existingWordIndex = dictionary.findIndex((w) => w.word === word)
      const now = new Date().toISOString()

      if (existingWordIndex >= 0) {
        // Обновляем существующее слово
        dictionary[existingWordIndex] = {
          ...dictionary[existingWordIndex],
          isKnown,
          updatedAt: now,
        }
      } else {
        // Добавляем новое слово
        dictionary.push({
          id: Date.now().toString(),
          word,
          isKnown,
          createdAt: now,
          updatedAt: now,
        })
      }

      // Сохраняем обновленный словарь
      localStorage.setItem(STORAGE_KEYS.DICTIONARY, JSON.stringify(dictionary))
    } catch (error) {
      console.error("Error adding/updating word:", error)
      throw error
    }
  }

  static saveDictionary(words: DictionaryWord[]): void {
    if (typeof window === "undefined") return

    try {
      // Try to save the dictionary
      localStorage.setItem(STORAGE_KEYS.DICTIONARY, JSON.stringify(words))
    } catch (error) {
      if (error instanceof DOMException && error.name === "QuotaExceededError") {
        console.warn("Local storage quota exceeded. Attempting to clean up...")

        // Try to clean up old data
        this.cleanupOldData()

        // Try saving again after cleanup
        try {
          localStorage.setItem(STORAGE_KEYS.DICTIONARY, JSON.stringify(words))
          return
        } catch (e) {
          console.error("Failed to save dictionary after cleanup:", e)
          throw new Error(
            "Dictionary is too large to store. Please remove some words or clear your browser data."
          )
        }
      }
      throw error
    }
  }

  private static cleanupOldData(): void {
    // Clean up old progress data (keep only the most recent 10 entries)
    const progress = this.getProgress()
    if (progress.length > 10) {
      const sortedProgress = [...progress].sort(
        (a, b) => new Date(b.lastReadDate).getTime() - new Date(a.lastReadDate).getTime()
      )
      this.saveProgress(sortedProgress.slice(0, 10))
    }

    // Clean up old books (keep only the most recent 20)
    const books = this.getBooks()
    if (books.length > 20) {
      const sortedBooks = [...books].sort(
        (a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
      )
      this.saveBooks(sortedBooks.slice(0, 20))
    }

    // Don't delete folders - they are user-created and important
    // Only clear temporary cache data if needed
  }

  static getSettings(): AppSettings {
    const defaultSettings = {
      highlightColor: "#3b82f6",
      groqApiKey: "",
      fontSize: 16,
      lineHeight: 1.6,
      letterSpacing: 0,
      wordSpacing: 0,
      paragraphSpacing: 16,
      textAlign: "left" as const,
      fontFamily: "system-ui",
      translationIconSize: 24,
    }

    if (typeof window === "undefined") {
      return defaultSettings
    }

    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS)
    if (!stored) {
      return defaultSettings
    }

    try {
      const parsed = JSON.parse(stored)
      // Merge with defaults to ensure all fields exist
      return {
        ...defaultSettings,
        ...parsed,
      }
    } catch (error) {
      console.error("Error parsing settings from localStorage:", error)
      return defaultSettings
    }
  }

  static saveSettings(settings: AppSettings): void {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))
  }

  static getProgress(): ReadingProgress[] {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem(STORAGE_KEYS.PROGRESS)
    return stored ? JSON.parse(stored) : []
  }

  static saveProgress(progress: ReadingProgress[]): void {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress))
  }
}

// Text analysis utilities
export class TextAnalyzer {
  static extractWords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/["'«»„"]/g, " ")
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 0)
  }

  static analyzeBookDifficulty(bookContent: string, knownWords: Set<string>) {
    const words = this.extractWords(bookContent)
    const uniqueWords = new Set(words)
    const totalUniqueWords = uniqueWords.size
    const knownCount = Array.from(uniqueWords).filter((word) => knownWords.has(word)).length
    const unknownCount = totalUniqueWords - knownCount

    return {
      totalCharacters: bookContent.length,
      uniqueWords: totalUniqueWords,
      knownWords: knownCount,
      unknownWords: unknownCount,
      difficultyPercentage:
        totalUniqueWords > 0 ? Math.round((unknownCount / totalUniqueWords) * 100) : 0,
    }
  }

  static splitIntoSentences(text: string): string[] {
    return text
      .split(/[.!?]+/)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length > 0)
  }
}
