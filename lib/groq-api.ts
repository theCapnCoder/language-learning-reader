// Groq API integration for translation services
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

  static async translateWord(word: string, sentence: string, apiKey: string): Promise<string> {
    if (!apiKey) {
      throw new Error("API ключ Groq не настроен. Перейдите в настройки для его добавления.")
    }

    const prompt = `Переведи на русский язык слово "${word}" в контексте предложения "${sentence}". Объясни значение слова, учитывая контекст, и если это фразовый глагол, дай его значение с учетом других слов в предложении.`

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

  static async translateSentence(sentence: string, apiKey: string): Promise<string> {
    if (!apiKey) {
      throw new Error("API ключ Groq не настроен. Перейдите в настройки для его добавления.")
    }

    const prompt = `Переведи на русский язык предложение: "${sentence}". Дай только перевод без дополнительных объяснений.`

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
}
