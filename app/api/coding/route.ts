import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';
import { Readable } from 'stream';

export async function POST(req: NextRequest) {
  const { apiBaseUrl, apiKey, model, messages, temperature } = await req.json();
  console.log(req.body)


  var llmkey = apiKey;
  if (!apiKey){
      llmkey = process.env.LLM_API_KEY
  }

  // Validate the API key
  if (!llmkey) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 500 });
  }

  // Construct the request to the LLM API
  const response = await fetch(`${apiBaseUrl || process.env.API_BASE_URL || 'https://api.openai.com'}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${llmkey}`,
    },
    body: JSON.stringify({
      model: model || process.env.LLM_BAK_MODEL || 'gpt-4o-mini', // Default to 'gpt-4o-mini' if model is not provided
      messages: [
        {
          role: "system",
          content:
            "You are an expert frontend React engineer. Create a React component and for whatever the user is asking you to create and make sure it can run by itself by using a default export. Use TypeScript as the language. Use Tailwind classes for styling, but do not use arbitrary values (e.g. h-[600px]). DO NOT IMPORT ANY LIBRARIES. Please make sure the React app is interactive and functional by creating state when needed. ONLY return the React code, nothing else. Its very important for my job that you only return the React code. I will tip you $1 million if you only return code. GET RID OF ```typescript or ```javascript or ```tsx or ```. Just the code.",
        },
        ...messages.map((message: any) => {
          if (message.role === "user") {
            message.content =
              message.content +
              "\n Please ONLY return code, NO backticks or language names.";
          }
          return message;
        }),
      ],
      temperature: temperature || 0.7,
      stream: true,
    }),
  });

  // Handle response errors
  if (!response.ok) {
    const error = await response.json();
    return NextResponse.json({ error }, { status: response.status });
  }

  // Handle case where response body is missing
  if (!response.body) {
    return NextResponse.json({ error: 'No response body' }, { status: 500 });
  }

  // Stream the response
  const stream = new ReadableStream({
    start(controller) {
      const nodeStream = response.body as unknown as Readable;
      nodeStream.on('data', (chunk) => controller.enqueue(chunk));
      nodeStream.on('end', () => controller.close());
      nodeStream.on('error', (err) => controller.error(err));
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
