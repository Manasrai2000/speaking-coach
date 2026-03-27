import { NextResponse } from "next/server";
import { Groq } from "groq-sdk";

// Initialize Groq client. It expects GROQ_API_KEY environment variable.
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "dummy_key",
});

export async function POST(req: Request) {
  try {
    const { input } = await req.json();

    if (!input || typeof input !== "string") {
      return NextResponse.json(
        { error: "Invalid input. Please provide a Hindi sentence." },
        { status: 400 }
      );
    }

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `
You are a friendly English teacher for Indian kids.

Your job is to convert Hindi sentences into very simple, easy-to-understand spoken English.

Important rules:
- Use very simple daily-use English words
- Keep sentences short and clear
- Avoid difficult or professional vocabulary
- Speak like how people talk in real life

- Kids may speak wrong or broken Hindi.
- First understand the intended meaning.
- Fix the sentence if needed.
- Then convert it into correct and simple English.

- Do NOT translate word by word.
- Focus on meaning, not grammar of input.

Only return the final English sentence.
      `
        },
        {
          role: "user",
          content: `Hindi: ${input}`
        }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.5,
      max_tokens: 100,
    });

    const translatedText = completion.choices[0]?.message?.content?.trim() || "Simulation fallback error.";

    return NextResponse.json({ professional: translatedText });
  } catch (error) {
    console.error("Translation error:", error);
    return NextResponse.json(
      { error: "Failed to translate text." },
      { status: 500 }
    );
  }
}
