"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload } from "lucide-react"
import { LocalDB, TextAnalyzer } from "@/lib/db"
import type { Book } from "@/lib/db"
import { useToast } from "@/hooks/use-toast"

interface BookUploadProps {
  onBooksUploaded: (books: Book[]) => void
  currentFolderId?: string | null
}

export function BookUpload({ onBooksUploaded, currentFolderId }: BookUploadProps) {
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setUploading(true)

      try {
        const textFiles = acceptedFiles.filter(
          (file) => file.type === "text/plain" || file.name.endsWith(".txt")
        )

        if (textFiles.length === 0) {
          toast({
            title: "Ошибка",
            description: "Пожалуйста, загрузите только .txt файлы",
            variant: "destructive",
          })
          return
        }

        const existingBooks = LocalDB.getBooks()
        const dictionary = LocalDB.getDictionary()
        const knownWords = new Set(dictionary.filter((w) => w.isKnown).map((w) => w.word))
        const newBooks: Book[] = []

        for (const file of textFiles) {
          const content = await file.text()
          const analysis = TextAnalyzer.analyzeBookDifficulty(content, knownWords)

          const book: Book = {
            id: crypto.randomUUID(),
            title: file.name.replace(".txt", ""),
            content,
            fileName: file.name,
            uploadDate: new Date(),
            charCount: analysis.totalCharacters,
            knownWords: analysis.knownWords,
            unknownWords: analysis.unknownWords,
            difficultyPercentage: analysis.difficultyPercentage,
            folderId: currentFolderId || undefined,
          }

          newBooks.push(book)
        }

        const updatedBooks = [...existingBooks, ...newBooks]
        LocalDB.saveBooks(updatedBooks)
        onBooksUploaded(updatedBooks)

        toast({
          title: "Успешно!",
          description: `Загружено ${newBooks.length} книг(и)`,
        })
      } catch (error) {
        console.error("Ошибка при загрузке книг:", error)
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить книги",
          variant: "destructive",
        })
      } finally {
        setUploading(false)
      }
    },
    [onBooksUploaded, toast]
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
          <h3 className="text-lg font-semibold mb-2">
            {isDragActive ? "Отпустите файлы здесь" : "Загрузите книги"}
          </h3>
          <p className="text-sm mb-4">Перетащите .txt файлы сюда или нажмите для выбора</p>
          <Button disabled={uploading} variant="outline">
            {uploading ? "Загрузка..." : "Выбрать файлы"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
