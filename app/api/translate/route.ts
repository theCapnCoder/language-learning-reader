import { type NextRequest, NextResponse } from "next/server"
import { GroqAPI } from "@/lib/groq-api"

export async function POST(request: NextRequest) {
  try {
    const { text, apiKey, type = "general" } = await request.json()

    if (!text || !apiKey) {
      return NextResponse.json({ error: "Text and API key are required" }, { status: 400 })
    }

    let translation: string

    if (type === "word") {
      const { word, sentence } = await request.json()
      translation = await GroqAPI.translateWord(word, sentence, apiKey)
    } else if (type === "sentence") {
      translation = await GroqAPI.translateSentence(text, apiKey)
    } else {
      // General translation for level analysis
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "user",
              content: text,
            },
          ],
        }),
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      translation = data.choices[0]?.message?.content || "Translation unavailable"
    }

    return NextResponse.json({ translation })
  } catch (error) {
    console.error("Translation API error:", error)
    return NextResponse.json({ error: "Translation failed" }, { status: 500 })
  }
}
