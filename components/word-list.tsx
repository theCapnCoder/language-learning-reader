"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Trash2, Check, X, FileText } from "lucide-react"
import { LocalDB, TextAnalyzer } from "@/lib/db"
import type { DictionaryWord } from "@/lib/db"
import { useToast } from "@/hooks/use-toast"

interface WordListProps {
  words: DictionaryWord[]
  onWordsUpdated: (words: DictionaryWord[]) => void
}

export function WordList({ words, onWordsUpdated }: WordListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [newWord, setNewWord] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)
  const { toast } = useToast()

  const filteredWords = words.filter((word) => word.word.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleAddWord = () => {
    if (!newWord.trim()) return

    const wordToAdd = newWord.trim().toLowerCase()
    const existingWord = words.find((w) => w.word.toLowerCase() === wordToAdd)

    if (existingWord) {
      toast({
        title: "Слово уже существует",
        description: "Это слово уже есть в вашем словаре",
        variant: "destructive",
      })
      return
    }

    const word: DictionaryWord = {
      id: crypto.randomUUID(),
      word: wordToAdd,
      isKnown: true,
      addedDate: new Date(),
    }

    const updatedWords = [...words, word]
    LocalDB.saveDictionary(updatedWords)
    onWordsUpdated(updatedWords)

    // Update book statistics
    updateBookStatistics(updatedWords)

    setNewWord("")
    setShowAddForm(false)

    toast({
      title: "Слово добавлено",
      description: `"${wordToAdd}" добавлено в словарь`,
    })
  }

  const handleToggleKnown = (wordId: string) => {
    const updatedWords = words.map((word) => (word.id === wordId ? { ...word, isKnown: !word.isKnown } : word))

    LocalDB.saveDictionary(updatedWords)
    onWordsUpdated(updatedWords)
    updateBookStatistics(updatedWords)
  }

  const handleDeleteWord = (wordId: string) => {
    const updatedWords = words.filter((word) => word.id !== wordId)
    LocalDB.saveDictionary(updatedWords)
    onWordsUpdated(updatedWords)
    updateBookStatistics(updatedWords)

    toast({
      title: "Слово удалено",
      description: "Слово было удалено из словаря",
    })
  }

  const updateBookStatistics = (updatedWords: DictionaryWord[]) => {
    const books = LocalDB.getBooks()
    const knownWordsSet = new Set(updatedWords.filter((w) => w.isKnown).map((w) => w.word))

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
  }

  const knownWordsCount = words.filter((w) => w.isKnown).length
  const unknownWordsCount = words.length - knownWordsCount

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{knownWordsCount}</div>
            <div className="text-sm text-muted-foreground">Изученные слова</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{unknownWordsCount}</div>
            <div className="text-sm text-muted-foreground">Изучаемые слова</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{words.length}</div>
            <div className="text-sm text-muted-foreground">Всего слов</div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск слов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Добавить слово
        </Button>
      </div>

      {/* Add word form */}
      {showAddForm && (
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Введите новое слово..."
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddWord()}
                className="flex-1"
              />
              <Button onClick={handleAddWord} disabled={!newWord.trim()}>
                Добавить
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Отмена
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Words list */}
      {filteredWords.length > 0 ? (
        <div className="grid gap-2">
          {filteredWords.map((word) => (
            <Card key={word.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{word.word}</span>
                    <Badge variant={word.isKnown ? "default" : "secondary"}>
                      {word.isKnown ? "Изучено" : "Изучается"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleKnown(word.id)}
                      className={word.isKnown ? "text-orange-600" : "text-green-600"}
                    >
                      {word.isKnown ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteWord(word.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : words.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Словарь пуст</h3>
            <p className="text-muted-foreground mb-6">Загрузите файл со словами или добавьте слова вручную</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Слова не найдены</h3>
            <p className="text-muted-foreground">Попробуйте изменить поисковый запрос</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
