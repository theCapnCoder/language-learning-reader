'use client';

import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Languages, X, Plus } from 'lucide-react';
import { GroqAPI } from '@/lib/groq-api';
import { LocalDB } from '@/lib/db';

interface InteractiveTextProps {
  content: string;
  knownWords: Set<string>;
  highlightColor: string;
  onWordsUpdated?: () => void;
}

interface Translation {
  word?: string;
  sentence?: string;
  content: string;
  loading: boolean;
}

interface SentenceTranslation {
  sentence: string;
  translation: string;
}

export function InteractiveText({
  content,
  knownWords,
  highlightColor,
  onWordsUpdated,
}: InteractiveTextProps) {
  const [translation, setTranslation] = useState<Translation | null>(null);
  const [sentenceTranslations, setSentenceTranslations] = useState<SentenceTranslation[]>([]);
  const [loadingSentences, setLoadingSentences] = useState<Set<string>>(new Set());

  const handleWordClick = useCallback(async (word: string, sentence: string) => {
    const settings = LocalDB.getSettings();

    if (!settings.groqApiKey) {
      setTranslation({
        word,
        content: 'API ключ Groq не настроен. Перейдите в настройки для его добавления.',
        loading: false,
      });
      return;
    }

    setTranslation({
      word,
      content: '',
      loading: true,
    });

    try {
      const translationContent = await GroqAPI.translateWord(word, sentence, settings.groqApiKey);
      setTranslation({
        word,
        content: translationContent,
        loading: false,
      });
    } catch (error) {
      setTranslation({
        word,
        content: `Ошибка перевода: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
        loading: false,
      });
    }
  }, []);

  const handleAddWordAsKnown = useCallback(() => {
    if (!translation?.word) return;

    const dictionary = LocalDB.getDictionary();
    const existingWord = dictionary.find((w) => w.word === translation.word);

    if (existingWord) {
      existingWord.isKnown = true;
      existingWord.updatedAt = new Date().toISOString();
    } else {
      dictionary.push({
        id: Date.now().toString(),
        word: translation.word,
        isKnown: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    LocalDB.saveDictionary(dictionary);
    setTranslation(null);
    onWordsUpdated?.();
  }, [translation?.word, onWordsUpdated]);

  const handleSentenceTranslate = useCallback(
    async (sentence: string) => {
      const settings = LocalDB.getSettings();

      if (!settings.groqApiKey) {
        return;
      }

      // Check if already translated or loading
      if (
        sentenceTranslations.some((st) => st.sentence === sentence) ||
        loadingSentences.has(sentence)
      ) {
        return;
      }

      setLoadingSentences((prev) => new Set(prev).add(sentence));

      try {
        const translationContent = await GroqAPI.translateSentence(sentence, settings.groqApiKey);
        setSentenceTranslations((prev) => [...prev, { sentence, translation: translationContent }]);
      } catch (error) {
        console.error('Translation error:', error);
      } finally {
        setLoadingSentences((prev) => {
          const newSet = new Set(prev);
          newSet.delete(sentence);
          return newSet;
        });
      }
    },
    [sentenceTranslations, loadingSentences]
  );

  const renderedText = useMemo(() => {
    const lines = content.split('\n');

    return lines.map((line, lineIndex) => {
      // if (!line.trim()) {
      //   return <br key={lineIndex} />;
      // }
      const sentences = line.split(/([.!?]+)/).filter((part) => part.trim());

      return (
        <div key={lineIndex} className="mb-2">
          {sentences.map((part, sentenceIndex) => {
            if (/^[.!?]+$/.test(part)) {
              const prevSentenceIndex = sentenceIndex - 1;
              const prevSentence =
                prevSentenceIndex >= 0 ? sentences[prevSentenceIndex]?.trim() : '';
              return (
                <span key={sentenceIndex}>
                  {part}
                  {prevSentence && (
                    <>
                      {loadingSentences.has(prevSentence) ? (
                        <Loader2 className="inline h-3 w-3 ml-1 animate-spin opacity-50" />
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-1 h-6 w-6 p-0 opacity-50 hover:opacity-100 transition-opacity"
                          onClick={() => handleSentenceTranslate(prevSentence)}
                        >
                          <Languages className="h-3 w-3" />
                        </Button>
                      )}
                      {sentenceTranslations.find((st) => st.sentence === prevSentence) && (
                        <span className="text-muted-foreground text-sm italic ml-2 inline">
                          {
                            sentenceTranslations.find((st) => st.sentence === prevSentence)
                              ?.translation
                          }
                        </span>
                      )}
                    </>
                  )}
                </span>
              );
            }
            const sentence = part.trim();
            if (!sentence) return null;
            const words = sentence
              .split(/([\s,;:()[\]{}""«»„”—–-]+)/)
              .filter((word) => word.trim());
            return (
              <span key={sentenceIndex} className="relative">
                {words.map((word, wordIndex) => {
                  if (/^[\s,;:()[\]{}""«»„”—–-]+$/.test(word)) {
                    return <span key={wordIndex}>{word}</span>;
                  }
                  // Clean the word while preserving apostrophes in contractions
                  let cleanWord = word
                    .toLowerCase()
                    // Remove surrounding quotes and punctuation, but keep apostrophes
                    .replace(/^[^\w']+|[^\w']+$/g, '')
                    // Keep only letters and apostrophes
                    .replace(/[^a-zA-Zа-яА-Я']/g, '');

                  // Check both the exact form and the base form (without 's)
                  const baseWord = cleanWord.replace(/'s$/, '');
                  const isKnown =
                    cleanWord && (knownWords.has(cleanWord) || knownWords.has(baseWord));
                  return (
                    <span key={wordIndex} className="relative">
                      <span
                        className={`cursor-pointer hover:bg-accent hover:text-accent-foreground rounded px-1 transition-colors ${
                          isKnown ? 'font-medium' : ''
                        }`}
                        style={{
                          color: isKnown ? highlightColor : 'inherit',
                        }}
                        onClick={() => handleWordClick(cleanWord, sentence)}
                      >
                        {word}
                      </span>
                    </span>
                  );
                })}
              </span>
            );
          })}
        </div>
      );
    });
  }, [
    content,
    knownWords,
    highlightColor,
    sentenceTranslations,
    loadingSentences,
    handleWordClick,
    handleSentenceTranslate,
  ]);

  return (
    <div className="space-y-4">
      <div className="prose prose-lg max-w-none leading-relaxed text-pretty break-words overflow-wrap-anywhere hyphens-auto">
        {renderedText}
      </div>

      {/* Word translation popup */}
      {translation?.word && (
        <Card className="fixed bottom-4 right-4 max-w-sm z-50 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                {!translation.loading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
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
  );
}
