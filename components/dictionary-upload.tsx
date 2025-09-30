"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload } from "lucide-react"
import { LocalDB, TextAnalyzer } from "@/lib/db"
import type { DictionaryWord } from "@/lib/db"
import { useToast } from "@/hooks/use-toast"

interface DictionaryUploadProps {
  onWordsUploaded: (words: DictionaryWord[]) => void
}

export function DictionaryUpload({ onWordsUploaded }: DictionaryUploadProps) {
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setUploading(true)

      try {
        const textFiles = acceptedFiles.filter((file) => file.type === "text/plain" || file.name.endsWith(".txt"))

        if (textFiles.length === 0) {
          toast({
            title: "Ошибка",
            description: "Пожалуйста, загрузите только .txt файлы",
            variant: "destructive",
          })
          return
        }

        const existingWords = LocalDB.getDictionary()
        const existingWordsSet = new Set(existingWords.map((w) => w.word.toLowerCase()))
        let newWordsCount = 0

        for (const file of textFiles) {
          const content = await file.text()
          const lines = content
            .split("\n")
            .map((line) => line.trim().toLowerCase())
            .filter((line) => line.length > 0)

          for (const word of lines) {
            if (!existingWordsSet.has(word)) {
              const newWord: DictionaryWord = {
                id: crypto.randomUUID(),
                word: word,
                isKnown: true,
                addedDate: new Date(),
              }
              existingWords.push(newWord)
              existingWordsSet.add(word)
              newWordsCount++
            }
          }
        }

        try {
          LocalDB.saveDictionary(existingWords)
          onWordsUploaded(existingWords)

          // Update book statistics after dictionary update
          const books = LocalDB.getBooks()
          const knownWordsSet = new Set(existingWords.filter((w) => w.isKnown).map((w) => w.word))

          const updatedBooks = books.map((book) => {
            const analysis = TextAnalyzer.analyzeBookDifficulty(book.content, knownWordsSet)
            return {
              ...book,
              knownWords: analysis.knownWords,
              unknownWords: analysis.unknownWords,
              difficultyPercentage: analysis.difficultyPercentage,
            }
          })

          LocalDB.saveBooks(updatedBooks)

          toast({
            title: "Успешно!",
            description: `Добавлено ${newWordsCount} новых слов в словарь`,
          })
        } catch (error) {
          console.error("Ошибка при сохранении словаря:", error)
          throw error // Re-throw to be caught by the outer catch
        }
      } catch (error) {
        console.error("Ошибка при загрузке словаря:", error)
        let errorMessage = "Не удалось загрузить словарь"
        
        if (error instanceof Error && error.message.includes('too large')) {
          errorMessage = "Словарь слишком большой. Пожалуйста, удалите некоторые слова или очистите данные браузера."
        } else if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          errorMessage = "Недостаточно места в хранилище браузера. Пожалуйста, удалите некоторые книги или очистите данные сайта."
        }
        
        toast({
          title: "Ошибка",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setUploading(false)
      }
    },
    [onWordsUploaded, toast],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/plain": [".txt"],
    },
    multiple: true,
  })

  return (
    <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
      <CardContent className="p-8">
        <div
          {...getRootProps()}
          className={`text-center cursor-pointer transition-colors ${
            isDragActive ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 mb-4" />
          <h3 className="text-lg font-semibold mb-2">{isDragActive ? "Отпустите файлы здесь" : "Загрузите словарь"}</h3>
          <p className="text-sm mb-4">
            Перетащите .txt файлы со словами (каждое слово на новой строке) или нажмите для выбора
          </p>
          <Button disabled={uploading} variant="outline">
            {uploading ? "Загрузка..." : "Выбрать файлы"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
