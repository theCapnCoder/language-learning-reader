import { LocalDB } from "./db"

export interface GroqResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

export class GroqAPI {
  private static readonly API_URL = "https://api.groq.com/openai/v1/chat/completions"
  private static readonly MODEL = "llama-3.3-70b-versatile"

  static async translateText(text: string, sentence?: string): Promise<string> {
    console.log({ text, sentence })
    // Get API key from settings
    let apiKey = ""
    if (typeof window !== "undefined") {
      const settings = LocalDB.getSettings()
      apiKey = settings?.groqApiKey || ""
    }

    if (!apiKey) {
      throw new Error("API ключ Groq не настроен. Перейдите в настройки для его добавления.")
    }

    let prompt: string
    if (sentence) {
      prompt = `Переведи на русский язык слово "${text}", которое используется в следующем предложении: "${sentence}". В ответе укажи только перевод слова, без дополнительных объяснений.`
    } else {
      prompt = `Переведи на русский язык слово: "${text}". В ответе укажи только перевод слова, без дополнительных объяснений.`
    }

    try {
      const response = await fetch(this.API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.MODEL,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      })

      if (!response.ok) {
        throw new Error(`Ошибка API: ${response.status} ${response.statusText}`)
      }

      const data: GroqResponse = await response.json()
      return data.choices[0]?.message?.content || "Перевод не найден"
    } catch (error) {
      console.error("Ошибка при переводе текста:", error)
      throw error
    }
  }

  static async translateWordWithBrackets(
    word: string,
    sentence: string,
    apiKey: string
  ): Promise<string> {
    if (!apiKey) {
      throw new Error("API ключ Groq не настроен. Перейдите в настройки для его добавления.")
    }

    const currentLanguage =
      typeof window !== "undefined" ? localStorage.getItem("currentLanguage") || "en" : "en"

    // Создаем улучшенный контекст с тремя предложениями
    const prompt = `Переведи на русский язык слово "${word}" в контексте предложения "${sentence}". 

ВНИМАНИЕ: В ответе укажи ТОЛЬКО ОДНО слово или короткую фразу (2-3 слова максимум) - точный перевод слова "${word}". Никаких объяснений, грамматических разборов, примеров или дополнительной информации. Только перевод!

Текущий язык: ${currentLanguage === "de" ? "немецкий" : "английский"}`

    try {
      const response = await fetch(this.API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.MODEL,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      })

      if (!response.ok) {
        throw new Error(`Ошибка API: ${response.status} ${response.statusText}`)
      }

      const data: GroqResponse = await response.json()
      let translation = data.choices[0]?.message?.content || "Перевод недоступен"

      // Очищаем ответ от лишнего, оставляем только первое слово/фразу
      translation = translation
        .replace(/^.*?:\s*["']?/, "")
        .replace(/["']?\s*$/, "")
        .replace(/\n.*$/, "")
        .trim()

      return translation
    } catch (error) {
      console.error("Ошибка при переводе слова:", error)
      throw error
    }
  }

  static async translateWord(word: string, sentence: string, apiKey: string): Promise<string> {
    if (!apiKey) {
      throw new Error("API ключ Groq не настроен. Перейдите в настройки для его добавления.")
    }

    console.log({ word, sentence })
    const currentLanguage =
      typeof window !== "undefined" ? localStorage.getItem("currentLanguage") || "en" : "en"

    let prompt: string

    if (currentLanguage === "de") {
      prompt = `Переведи на русский язык слово "${word}" в контексте предложения "${sentence}".  Объясни значение этого слова с учетом контекста.  Если у глагола отделяемая или неотделяемая приставка, укажи это и объясни значение. Если это идиома, объясни её значение, учитывая контекст предложения.`
    } else {
      prompt = `Переведи на русский язык слово "${word}" в контексте предложения "${sentence}".  Объясни значение этого слова с учетом контекста.  Если это фразовый глагол, укажи его значение, учитывая другие слова в предложении.`
    }
    try {
      const response = await fetch(this.API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.MODEL,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      })

      if (!response.ok) {
        throw new Error(`Ошибка API: ${response.status} ${response.statusText}`)
      }

      const data: GroqResponse = await response.json()
      return data.choices[0]?.message?.content || "Перевод недоступен"
    } catch (error) {
      console.error("Ошибка при переводе слова:", error)
      throw error
    }
  }

  static async explainWordInContext(word: string, sentence: string): Promise<string> {
    console.log({ word, sentence })
    // Get API key from settings
    let apiKey = ""
    if (typeof window !== "undefined") {
      const settings = LocalDB.getSettings()
      apiKey = settings?.groqApiKey || ""
    }

    if (!apiKey) {
      throw new Error("API ключ Groq не настроен. Перейдите в настройки для его добавления.")
    }

    const currentLanguage =
      typeof window !== "undefined" ? localStorage.getItem("currentLanguage") || "en" : "en"

    const prompt = `Дай краткое объяснение слова "${word}" в контексте предложения: "${sentence}". 

Текущий язык: ${currentLanguage === "de" ? "немецкий" : "английский"}

Объясни:
1. Основное значение слова в данном контексте
2. Особенности использования (если это фразовый глагол, идиома, или отделяемая приставка в немецком)
3. Почему именно такой перевод подходит к этому предложению

Ответ дай кратко, 2-3 предложения, на русском языке.`

    try {
      const response = await fetch(this.API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.MODEL,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      })

      if (!response.ok) {
        throw new Error(`Ошибка API: ${response.status} ${response.statusText}`)
      }

      const data: GroqResponse = await response.json()
      return data.choices[0]?.message?.content || "Объяснение недоступно"
    } catch (error) {
      console.error("Ошибка при объяснении слова:", error)
      throw error
    }
  }

  static async translateSentence(sentence: string, apiKey: string): Promise<string> {
    if (!apiKey) {
      throw new Error("API ключ Groq не настроен. Перейдите в настройки для его добавления.")
    }

    const currentLanguage =
      typeof window !== "undefined" ? localStorage.getItem("currentLanguage") || "en" : "en"

    let prompt: string

    if (currentLanguage === "de") {
      prompt = `Переведи на русский язык: "${sentence}". 
Дай только перевод без дополнительных объяснений.`
    } else {
      prompt = `Переведи на русский язык: "${sentence}". 
Дай только перевод без дополнительных объяснений.`
    }

    try {
      const response = await fetch(this.API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.MODEL,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      })

      if (!response.ok) {
        throw new Error(`Ошибка API: ${response.status} ${response.statusText}`)
      }

      const data: GroqResponse = await response.json()
      let translation = data.choices[0]?.message?.content || "Перевод недоступен"

      translation = translation
        .replace(/^.*?:\s*["']?/, "")
        .replace(/["']?\s*$/, "")
        .trim()

      return translation
    } catch (error) {
      console.error("Ошибка при переводе предложения:", error)
      throw error
    }
  }

  // Новый метод для получения всех данных о слове одним запросом
  static async getWordDataComplete(
    word: string,
    sentence: string,
    apiKey: string
  ): Promise<{
    wordTranslation: string
    sentenceTranslation: string
    explanation: string
  }> {
    if (!apiKey) {
      throw new Error("API ключ Groq не настроен. Перейдите в настройки для его добавления.")
    }

    const currentLanguage =
      typeof window !== "undefined" ? localStorage.getItem("currentLanguage") || "en" : "en"

    const prompt = `Дай полную информацию о слове "${word}" из предложения: "${sentence}".

Текущий язык: ${currentLanguage === "de" ? "немецкий" : "английский"}

Отвечай в следующем формате, строго по разделам:

===ПЕРЕВОД СЛОВА===
[Только перевод слова "${word}" на русский язык, 1-2 слова максимум]

===ПЕРЕВОД ПРЕДЛОЖЕНИЯ===
[Полный перевод предложения "${sentence}" на русский язык]

===ОБЪЯСНЕНИЕ===
[Краткое объяснение слова "${word}" в контексте предложения: 2-3 предложения на русском языке]`

    try {
      const response = await fetch(this.API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.MODEL,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      })

      if (!response.ok) {
        throw new Error(`Ошибка API: ${response.status} ${response.statusText}`)
      }

      const data: GroqResponse = await response.json()
      const content = data.choices[0]?.message?.content || ""

      // Парсим ответ по разделам
      const sections = content.split("===").filter((section) => section.trim())

      let wordTranslation = ""
      let sentenceTranslation = ""
      let explanation = ""

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i].trim()

        if (section === "ПЕРЕВОД СЛОВА") {
          // Следующий элемент после заголовка - это содержимое
          if (i + 1 < sections.length) {
            wordTranslation = sections[i + 1].replace(/\n/g, "").trim()
          }
        } else if (section === "ПЕРЕВОД ПРЕДЛОЖЕНИЯ") {
          // Следующий элемент после заголовка - это содержимое
          if (i + 1 < sections.length) {
            sentenceTranslation = sections[i + 1].replace(/\n/g, "").trim()
          }
        } else if (section === "ОБЪЯСНЕНИЕ") {
          // Следующий элемент после заголовка - это содержимое
          if (i + 1 < sections.length) {
            explanation = sections[i + 1].replace(/\n/g, "").trim()
          }
        }
      }

      return {
        wordTranslation: wordTranslation || "Перевод недоступен",
        sentenceTranslation: sentenceTranslation || "Перевод недоступен",
        explanation: explanation || "Объяснение недоступно",
      }
    } catch (error) {
      console.error("Ошибка при получении данных о слове:", error)
      throw error
    }
  }
}

const API_URL = "https://api.groq.com/openai/v1/chat/completions"
const MODEL = "llama-3.3-70b-versatile"

export const translateText = async (text: string): Promise<string> => {
  // Get API key from settings
  let apiKey = ""
  if (typeof window !== "undefined") {
    const settings = LocalDB.getSettings()
    apiKey = settings?.groqApiKey || ""
  }

  if (!apiKey) {
    throw new Error("API ключ Groq не настроен. Перейдите в настройки для его добавления.")
  }

  const prompt = `Переведи на русский язык: "${text}"`

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`Ошибка API: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || "Перевод не найден"
  } catch (error) {
    console.error("Ошибка при переводе текста:", error)
    throw error
  }
}
