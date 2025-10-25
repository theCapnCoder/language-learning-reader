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
}
