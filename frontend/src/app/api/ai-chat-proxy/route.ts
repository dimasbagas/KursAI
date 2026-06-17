import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { pesan } = await request.json();
    const apiKey = process.env.NEXT_PUBLIC_AI_API_KEY || "sika-681be5a7ff0b0987c799b7d617a4c6d9";

    const response = await fetch("https://generatedpromptpro.online/xieqa/llm/api/bot_api.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ pesan }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("LLM API failed response:", errText);
      return NextResponse.json(
        { error: `LLM API returned status ${response.status}`, details: errText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Proxy routing error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
