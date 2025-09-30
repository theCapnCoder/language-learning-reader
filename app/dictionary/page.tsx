'use client';

import { useState, useEffect } from 'react';
import { DictionaryUpload } from '@/components/dictionary-upload';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Download, FileText, List } from 'lucide-react';
import { LocalDB } from '@/lib/db';
import type { DictionaryWord } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';

export default function DictionaryPage() {
  const [words, setWords] = useState<DictionaryWord[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [showWordsList, setShowWordsList] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadedWords = LocalDB.getDictionary();
    setWords(loadedWords);
  }, []);

  const handleWordsUploaded = (updatedWords: DictionaryWord[]) => {
    setWords(updatedWords);
    setShowUpload(false);
  };

  const handleExportDictionary = () => {
    if (words.length === 0) {
      toast({
        title: 'Словарь пуст',
        description: 'Нет слов для экспорта',
        variant: 'destructive',
      });
      return;
    }

    const knownWords = words.filter((w) => w.isKnown).map((w) => w.word);
    const unknownWords = words.filter((w) => !w.isKnown).map((w) => w.word);

    const content = [
      '# Изученные слова',
      ...knownWords,
      '',
      '# Изучаемые слова',
      ...unknownWords,
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dictionary_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Словарь экспортирован',
      description: 'Файл со словарем был сохранен',
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-balance">Словарь</h1>
          <p className="text-muted-foreground mt-1">Управляйте своим словарем изученных слов</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportDictionary}>
            <Download className="h-4 w-4 mr-2" />
            Экспорт
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowWordsList(!showWordsList)}
            className="flex items-center gap-2"
          >
            <List className="h-4 w-4" />
            {showWordsList ? 'Скрыть слова' : 'Показать все слова'}
          </Button>
          <Button onClick={() => setShowUpload(!showUpload)}>
            <Upload className="h-4 w-4 mr-2" />
            Загрузить словарь
          </Button>
        </div>
      </div>

      {/* Upload section */}
      {showUpload && <DictionaryUpload onWordsUploaded={handleWordsUploaded} />}

      {/* Words list section */}
      {showWordsList && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {words.length > 0 ? (
                  words.map((wordItem) => (
                    <div
                      key={wordItem.id}
                      className={`p-2 rounded border ${wordItem.isKnown ? 'bg-green-50 dark:bg-green-900/20' : 'bg-muted/50'}`}
                    >
                      <div className="font-medium">{wordItem.word}</div>
                      <div className="text-sm text-muted-foreground">
                        {wordItem.isKnown ? 'Изучено' : 'В процессе изучения'}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">Словарь пуст</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-semibold mb-2">Формат файла словаря:</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Загружайте .txt файлы, где каждое слово находится на отдельной строке:
              </p>
              <div className="bg-background rounded p-2 text-sm font-mono">
                hello
                <br />
                world
                <br />
                language
                <br />
                learning
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            Словарь содержит {words.filter((w) => w.isKnown).length} изученных слов из{' '}
            {words.length} общих.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
