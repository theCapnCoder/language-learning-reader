'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { InteractiveText } from '@/components/interactive-text';
import { ReadingControls } from '@/components/reading-controls';
import { ArrowLeft, BookOpen, BarChart3 } from 'lucide-react';
import { LocalDB } from '@/lib/db';
import type { Book, ReadingProgress } from '@/lib/db';

export default function ReadBookPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.id as string;
  const contentRef = useRef<HTMLDivElement>(null);

  const [book, setBook] = useState<Book | null>(null);
  const [knownWords, setKnownWords] = useState<Set<string>>(new Set());
  const [fontSize, setFontSize] = useState(16);
  const [highlightColor, setHighlightColor] = useState('#3b82f6');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);

  const loadBookData = () => {
    // Load book
    const books = LocalDB.getBooks();
    const foundBook = books.find((b) => b.id === bookId);

    if (!foundBook) {
      router.push('/');
      return;
    }

    setBook(foundBook);

    // Load dictionary
    const dictionary = LocalDB.getDictionary();
    const knownWordsSet = new Set(
      dictionary.filter((w) => w.isKnown).map((w) => w.word.toLowerCase())
    );
    setKnownWords(knownWordsSet);

    // Load settings
    const settings = LocalDB.getSettings();
    setHighlightColor(settings.highlightColor);

    const progressData = LocalDB.getProgress();
    const bookProgress = progressData.find((p) => p.bookId === bookId);
    if (bookProgress) {
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.scrollTop = bookProgress.currentPosition;
        }
      }, 100);
    }
  };

  const handleScroll = () => {
    if (contentRef.current && book) {
      const scrollTop = contentRef.current.scrollTop;
      const scrollHeight = contentRef.current.scrollHeight;
      const clientHeight = contentRef.current.clientHeight;

      const progress = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
      setReadingProgress(Math.min(progress, 100));

      // Save progress to localStorage
      const progressData = LocalDB.getProgress();
      const existingIndex = progressData.findIndex((p) => p.bookId === bookId);
      const newProgress: ReadingProgress = {
        bookId,
        currentPosition: scrollTop,
        lastReadDate: new Date(),
      };

      if (existingIndex >= 0) {
        progressData[existingIndex] = newProgress;
      } else {
        progressData.push(newProgress);
      }

      LocalDB.saveProgress(progressData);
    }
  };

  useEffect(() => {
    loadBookData();
  }, [bookId, router]);

  const handleWordsUpdated = () => {
    loadBookData();
  };

  const handleHighlightColorChange = (color: string) => {
    setHighlightColor(color);
    const settings = LocalDB.getSettings();
    LocalDB.saveSettings({ ...settings, highlightColor: color });
  };

  const handleDarkModeToggle = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  if (!book) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <BookOpen className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Загрузка книги...</h2>
        </div>
      </div>
    );
  }

  const truncateTitle = (title: string, maxLength: number = 20) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  };

  return (
    <div className="mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push('/')}>
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
            <span>{(book.wordCount || 0).toLocaleString()} слов</span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              <span>Сложность: {book.difficultyPercentage}%</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Прочитано: {readingProgress}%</span>
        </div>
      </div>

      {/* Reading stats */}
      {/* <Card>
        <CardHeader className="pb-3">
          <h3 className="font-semibold">Статистика чтения</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{book.knownWords}</div>
              <div className="text-sm text-muted-foreground">Изученные слова</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{book.unknownWords}</div>
              <div className="text-sm text-muted-foreground">Неизвестные слова</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{book.difficultyPercentage}%</div>
              <div className="text-sm text-muted-foreground">Сложность</div>
            </div>
          </div>
        </CardContent>
      </Card> */}

      {/* Reading area */}
      {/* <Card> */}
      {/* <CardContent className="p-8"> */}
      <div
        ref={contentRef}
        className="reading-content break-words overflow-wrap-anywhere max-w-full"
        style={{ fontSize: `${fontSize}px` }}
        onScroll={handleScroll}
      >
        <InteractiveText
          content={book.content}
          knownWords={knownWords}
          highlightColor={highlightColor}
          onWordsUpdated={handleWordsUpdated}
        />
      </div>
      {/* </CardContent> */}
      {/* </Card> */}

      {/* Reading controls */}
      <ReadingControls
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        highlightColor={highlightColor}
        onHighlightColorChange={handleHighlightColorChange}
        isDarkMode={isDarkMode}
        onDarkModeToggle={handleDarkModeToggle}
      />
    </div>
  );
}
