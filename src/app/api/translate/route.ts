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
          content: "You are an English communication expert.\n\nConvert the given Hindi sentence into a professional, polite, and natural English sentence suitable for workplace or formal conversation.\n\nOnly return the final sentence. Do not add explanations."
        },
        {
          role: "user",
          content: `Hindi: ${input}`
        }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.3,
      max_tokens: 150,
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
