"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Brain, TrendingUp } from "lucide-react"
import type { Book, DictionaryWord } from "@/lib/db"

interface StatisticsOverviewProps {
  books: Book[]
  words: DictionaryWord[]
}

export function StatisticsOverview({ books, words }: StatisticsOverviewProps) {
  const totalBooks = books.length
  const totalWords = books.reduce((sum, book) => sum + book.wordCount, 0)
  const knownWords = words.filter((w) => w.isKnown).length
  const totalDictionaryWords = words.length

  const averageDifficulty =
    totalBooks > 0 ? Math.round(books.reduce((sum, book) => sum + book.difficultyPercentage, 0) / totalBooks) : 0

  const knownWordsPercentage = totalDictionaryWords > 0 ? Math.round((knownWords / totalDictionaryWords) * 100) : 0

  const stats = [
    {
      title: "Всего книг",
      value: totalBooks,
      icon: BookOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Слов в библиотеке",
      value: totalWords.toLocaleString(),
      icon: BookOpen,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Изученных слов",
      value: knownWords,
      icon: Brain,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Средняя сложность",
      value: `${averageDifficulty}%`,
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Main stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Progress indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <h3 className="font-semibold">Прогресс изучения слов</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Изучено слов</span>
                <span>
                  {knownWords} из {totalDictionaryWords}
                </span>
              </div>
              <Progress value={knownWordsPercentage} className="h-2" />
              <p className="text-xs text-muted-foreground">{knownWordsPercentage}% словаря изучено</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <h3 className="font-semibold">Сложность библиотеки</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Средняя сложность</span>
                <span>{averageDifficulty}%</span>
              </div>
              <Progress value={100 - averageDifficulty} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {averageDifficulty < 30
                  ? "Легкая библиотека"
                  : averageDifficulty < 60
                    ? "Средняя сложность"
                    : "Сложная библиотека"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Books breakdown */}
      {totalBooks > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <h3 className="font-semibold">Анализ книг по сложности</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {books.map((book) => (
                <div key={book.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{book.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {book.wordCount.toLocaleString()} слов • {book.knownWords} изучено • {book.unknownWords}{" "}
                      неизвестно
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{book.difficultyPercentage}%</div>
                    <div
                      className={`text-xs ${
                        book.difficultyPercentage < 20
                          ? "text-green-600"
                          : book.difficultyPercentage < 40
                            ? "text-yellow-600"
                            : book.difficultyPercentage < 60
                              ? "text-orange-600"
                              : "text-red-600"
                      }`}
                    >
                      {book.difficultyPercentage < 20
                        ? "Легкая"
                        : book.difficultyPercentage < 40
                          ? "Средняя"
                          : book.difficultyPercentage < 60
                            ? "Сложная"
                            : "Очень сложная"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
